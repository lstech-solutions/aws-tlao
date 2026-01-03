/**
 * Session model with authentication and token management
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { dynamoDBService } from '../services/dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { Session } from './types';

/**
 * Session creation parameters
 */
export interface CreateSessionParams {
  userId: string;
  ipAddress: string;
  expirationHours?: number;
}

/**
 * API key generation result
 */
export interface ApiKeyResult {
  apiKey: string;
  hashedKey: string;
}

/**
 * Session model class with DynamoDB operations
 */
export class SessionModel {
  private static readonly DEFAULT_EXPIRATION_HOURS = 24 * 7; // 7 days
  private static readonly API_KEY_LENGTH = 32;

  /**
   * Create a new session with API key
   */
  static async create(params: CreateSessionParams): Promise<{ session: Session; apiKey: string }> {
    const sessionId = uuidv4();
    const now = Date.now();
    const expirationHours = params.expirationHours || this.DEFAULT_EXPIRATION_HOURS;
    const expiresAt = now + (expirationHours * 60 * 60 * 1000);

    // Generate API key
    const { apiKey, hashedKey } = this.generateApiKey();

    const session: Session = {
      sessionId,
      userId: params.userId,
      apiKey: hashedKey,
      createdAt: now,
      expiresAt,
      lastUsedAt: now,
      ipAddress: params.ipAddress,
    };

    try {
      await dynamoDBService.put(config.dynamodb.sessionsTable, session);
      logger.info('Session created successfully', { sessionId, userId: params.userId });
      
      return { session, apiKey };
    } catch (error) {
      logger.error('Failed to create session', { userId: params.userId, error: (error as Error).message });
      throw new Error(`Failed to create session: ${(error as Error).message}`);
    }
  }

  /**
   * Get session by ID
   */
  static async getById(sessionId: string): Promise<Session | null> {
    try {
      const session = await dynamoDBService.get<Session>(config.dynamodb.sessionsTable, { sessionId });
      
      if (session) {
        logger.debug('Session retrieved by ID', { sessionId });
        
        // Check if session is expired
        if (this.isExpired(session)) {
          logger.debug('Session is expired', { sessionId });
          await this.delete(sessionId);
          return null;
        }
      } else {
        logger.debug('Session not found by ID', { sessionId });
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session by ID', { sessionId, error: (error as Error).message });
      throw new Error(`Failed to get session: ${(error as Error).message}`);
    }
  }

  /**
   * Validate API key and return session
   */
  static async validateApiKey(apiKey: string): Promise<Session | null> {
    try {
      const hashedKey = this.hashApiKey(apiKey);
      
      // Query sessions by hashed API key (would need GSI in real implementation)
      // For now, we'll scan (not efficient, but works for demo)
      const result = await dynamoDBService.scan<Session>({
        tableName: config.dynamodb.sessionsTable,
        filterExpression: 'apiKey = :apiKey',
        expressionAttributeValues: {
          ':apiKey': hashedKey,
        },
        limit: 1,
      });

      const session = result.items[0] || null;
      
      if (session) {
        // Check if session is expired
        if (this.isExpired(session)) {
          logger.debug('Session is expired during API key validation', { sessionId: session.sessionId });
          await this.delete(session.sessionId);
          return null;
        }

        // Update last used timestamp
        await this.updateLastUsed(session.sessionId);
        
        logger.debug('API key validated successfully', { sessionId: session.sessionId });
        return session;
      } else {
        logger.debug('Invalid API key provided');
        return null;
      }
    } catch (error) {
      logger.error('Failed to validate API key', { error: (error as Error).message });
      throw new Error(`Failed to validate API key: ${(error as Error).message}`);
    }
  }

  /**
   * Get all sessions for a user
   */
  static async getByUserId(userId: string): Promise<Session[]> {
    try {
      const result = await dynamoDBService.query<Session>({
        tableName: config.dynamodb.sessionsTable,
        indexName: 'UserIdIndex',
        keyConditionExpression: 'userId = :userId',
        expressionAttributeValues: {
          ':userId': userId,
        },
      });

      // Filter out expired sessions
      const activeSessions = result.items.filter(session => !this.isExpired(session));
      
      logger.debug('Sessions retrieved for user', { userId, count: activeSessions.length });
      return activeSessions;
    } catch (error) {
      logger.error('Failed to get sessions by user ID', { userId, error: (error as Error).message });
      throw new Error(`Failed to get sessions: ${(error as Error).message}`);
    }
  }

  /**
   * Update session's last used timestamp
   */
  static async updateLastUsed(sessionId: string): Promise<void> {
    try {
      await dynamoDBService.update({
        tableName: config.dynamodb.sessionsTable,
        key: { sessionId },
        updateExpression: 'SET lastUsedAt = :lastUsedAt',
        expressionAttributeValues: {
          ':lastUsedAt': Date.now(),
        },
      });

      logger.debug('Session last used updated', { sessionId });
    } catch (error) {
      logger.error('Failed to update session last used', { sessionId, error: (error as Error).message });
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Delete session
   */
  static async delete(sessionId: string): Promise<void> {
    try {
      await dynamoDBService.delete(config.dynamodb.sessionsTable, { sessionId });
      logger.info('Session deleted successfully', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', { sessionId, error: (error as Error).message });
      throw new Error(`Failed to delete session: ${(error as Error).message}`);
    }
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteByUserId(userId: string): Promise<void> {
    try {
      const sessions = await this.getByUserId(userId);
      
      for (const session of sessions) {
        await this.delete(session.sessionId);
      }

      logger.info('All sessions deleted for user', { userId, count: sessions.length });
    } catch (error) {
      logger.error('Failed to delete sessions by user ID', { userId, error: (error as Error).message });
      throw new Error(`Failed to delete sessions: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = Date.now();
      let deletedCount = 0;
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const result = await dynamoDBService.scan<Session>({
          tableName: config.dynamodb.sessionsTable,
          filterExpression: 'expiresAt < :now',
          expressionAttributeValues: {
            ':now': now,
          },
          limit: 25, // Process in batches
          exclusiveStartKey: lastEvaluatedKey,
        });

        for (const session of result.items) {
          await this.delete(session.sessionId);
          deletedCount++;
        }

        lastEvaluatedKey = result.lastEvaluatedKey;
      } while (lastEvaluatedKey);

      logger.info('Expired sessions cleaned up', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error: (error as Error).message });
      throw new Error(`Failed to cleanup expired sessions: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a new API key
   */
  private static generateApiKey(): ApiKeyResult {
    const apiKey = crypto.randomBytes(this.API_KEY_LENGTH).toString('hex');
    const hashedKey = this.hashApiKey(apiKey);
    
    return { apiKey, hashedKey };
  }

  /**
   * Hash an API key for storage
   */
  private static hashApiKey(apiKey: string): string {
    return crypto
      .createHmac('sha256', config.api.keyHashSecret)
      .update(apiKey)
      .digest('hex');
  }

  /**
   * Check if session is expired
   */
  private static isExpired(session: Session): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Validate session data
   */
  static validate(session: Partial<Session>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!session.userId) {
      errors.push('User ID is required');
    }

    if (!session.apiKey) {
      errors.push('API key is required');
    }

    if (!session.ipAddress) {
      errors.push('IP address is required');
    }

    if (session.expiresAt && session.createdAt && session.expiresAt <= session.createdAt) {
      errors.push('Expiration time must be after creation time');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
/**
 * Rate limiter service for Free Tier enforcement
 */

import { DynamoDBService } from './dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { RateLimitUsage } from '../models/types';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfter?: number; // Seconds until reset
}

/**
 * Rate limiter service with DynamoDB tracking
 */
export class RateLimiterService {
  private dynamoDB: DynamoDBService;
  private readonly defaultConfig = {
    maxRequests: 100,
    windowMinutes: 1,
  };

  constructor() {
    this.dynamoDB = new DynamoDBService();
  }

  /**
   * Check if request is allowed and update counter
   */
  async checkRateLimit(userId: string, maxRequests: number = this.defaultConfig.maxRequests, windowMinutes: number = this.defaultConfig.windowMinutes): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const windowStart = now - windowMs;

    try {
      // Check if there's an existing rate limit record for this window
      const existing = await this.getRateLimitRecord(userId);

      if (existing) {
        // Record exists, check if within limit
        if (existing.requestCount >= maxRequests) {
          const resetAt = windowStart + windowMs;
          const retryAfter = Math.ceil((resetAt - now) / 1000);

          logger.warn('Rate limit exceeded', {
            userId,
            currentCount: existing.requestCount,
            limit: maxRequests,
            retryAfter,
          });

          return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfter,
          };
        }

        // Increment counter
        await this.dynamoDB.update({
          tableName: config.dynamodb.sessionsTable,
          key: { sessionId: existing.sessionId },
          updateExpression: 'SET requestCount = :newCount, lastUpdated = :now',
          expressionAttributeValues: {
            ':newCount': existing.requestCount + 1,
            ':now': now,
          },
        });

        return {
          allowed: true,
          remaining: maxRequests - (existing.requestCount + 1),
          resetAt: windowStart + windowMs,
        };
      }

      // Create new rate limit record
      const sessionId = `ratelimit:${userId}:${windowStart}`;
      await this.dynamoDB.put(config.dynamodb.sessionsTable, {
        sessionId,
        userId,
        requestCount: 1,
        windowStart,
        createdAt: now,
        lastUpdated: now,
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: windowStart + windowMs,
      };
    } catch (error) {
      logger.error('Rate limit check failed', {
        userId,
        error: (error as Error).message,
      });

      // Fail open - allow request if DynamoDB fails
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: windowStart + windowMs,
      };
    }
  }

  /**
   * Get rate limit record for user
   */
  private async getRateLimitRecord(userId: string): Promise<RateLimitUsage | null> {
    try {
      const result = await this.dynamoDB.query<RateLimitUsage>({
        tableName: config.dynamodb.sessionsTable,
        keyConditionExpression: 'userId = :userId AND begins_with(sessionId, :prefix)',
        expressionAttributeValues: {
          ':userId': userId,
          ':prefix': `ratelimit:${userId}:`,
        },
        limit: 1,
      });

      return result.items[0] || null;
    } catch (error) {
      logger.error('Failed to get rate limit record', {
        userId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(userId: string, maxRequests: number = this.defaultConfig.maxRequests, windowMinutes: number = this.defaultConfig.windowMinutes): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const windowStart = now - windowMs;

    try {
      const existing = await this.getRateLimitRecord(userId);

      if (!existing) {
        return {
          allowed: true,
          remaining: maxRequests,
          resetAt: windowStart + windowMs,
        };
      }

      const remaining = Math.max(0, maxRequests - existing.requestCount);
      const resetAt = windowStart + windowMs;

      return {
        allowed: existing.requestCount < maxRequests,
        remaining,
        resetAt,
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', {
        userId,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: windowStart + windowMs,
      };
    }
  }

  /**
   * Clean up old rate limit records
   */
  async cleanupOldRecords(maxAgeMinutes: number = 60): Promise<number> {
    try {
      const now = Date.now();
      const maxAgeMs = maxAgeMinutes * 60 * 1000;
      let deletedCount = 0;
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const result = await this.dynamoDB.scan<RateLimitUsage>({
          tableName: config.dynamodb.sessionsTable,
          filterExpression: 'begins_with(sessionId, :prefix) AND lastUpdated < :maxAge',
          expressionAttributeValues: {
            ':prefix': 'ratelimit:',
            ':maxAge': now - maxAgeMs,
          },
          limit: 25,
          exclusiveStartKey: lastEvaluatedKey,
        });

        for (const record of result.items) {
          await this.dynamoDB.delete(config.dynamodb.sessionsTable, { sessionId: record.sessionId });
          deletedCount++;
        }

        lastEvaluatedKey = result.lastEvaluatedKey;
      } while (lastEvaluatedKey);

      logger.info('Rate limit records cleaned up', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup rate limit records', {
        error: (error as Error).message,
      });
      return 0;
    }
  }
}

// Export singleton instance
export const rateLimiterService = new RateLimiterService();

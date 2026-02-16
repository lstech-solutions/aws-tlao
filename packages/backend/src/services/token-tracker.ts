/**
 * Token tracker service for Free Tier enforcement
 */

import { DynamoDBService } from './dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { TokenUsage } from '../models/types';

/**
 * Token tracking result
 */
export interface TokenResult {
  allowed: boolean;
  currentUsage: number;
  remaining: number;
  dailyLimit: number;
  percentageUsed: number;
}

/**
 * Token tracker service with DynamoDB tracking
 */
export class TokenTrackerService {
  private dynamoDB: DynamoDBService;
  private readonly defaultConfig = {
    dailyLimit: 100000, // 100,000 tokens per day
  };

  constructor() {
    this.dynamoDB = new DynamoDBService();
  }

  /**
   * Check if token usage is allowed and increment
   */
  async trackTokens(userId: string, tokensUsed: number, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<TokenResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Get current usage for today
      const usage = await this.getUsage(userId, today);

      if (usage) {
        // Check if adding tokens would exceed limit
        const newUsage = usage.currentUsage + tokensUsed;

        if (newUsage > dailyLimit) {
          logger.warn('Token limit exceeded', {
            userId,
            currentUsage: usage.currentUsage,
            requested: tokensUsed,
            limit: dailyLimit,
          });

          return {
            allowed: false,
            currentUsage: usage.currentUsage,
            remaining: 0,
            dailyLimit,
            percentageUsed: (usage.currentUsage / dailyLimit) * 100,
          };
        }

        // Update usage
        await this.dynamoDB.update({
          tableName: config.dynamodb.sessionsTable,
          key: { userId: usage.userId, date: usage.date },
          updateExpression: 'SET currentUsage = :newUsage, lastUpdated = :now',
          expressionAttributeValues: {
            ':newUsage': newUsage,
            ':now': Date.now(),
          },
        });

        return {
          allowed: true,
          currentUsage: newUsage,
          remaining: dailyLimit - newUsage,
          dailyLimit,
          percentageUsed: (newUsage / dailyLimit) * 100,
        };
      }

      // Create new usage record
      const sessionId = `tokenusage:${userId}:${today}`;
      await this.dynamoDB.put(config.dynamodb.sessionsTable, {
        sessionId,
        userId,
        date: today,
        currentUsage: tokensUsed,
        dailyLimit,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      });

      return {
        allowed: true,
        currentUsage: tokensUsed,
        remaining: dailyLimit - tokensUsed,
        dailyLimit,
        percentageUsed: (tokensUsed / dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Token tracking failed', {
        userId,
        tokensUsed,
        error: (error as Error).message,
      });

      // Fail open - allow request if DynamoDB fails
      return {
        allowed: true,
        currentUsage: tokensUsed,
        remaining: dailyLimit - tokensUsed,
        dailyLimit,
        percentageUsed: (tokensUsed / dailyLimit) * 100,
      };
    }
  }

  /**
   * Get current token usage without incrementing
   */
  async getStatus(userId: string, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<TokenResult> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const usage = await this.getUsage(userId, today);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          remaining: dailyLimit,
          dailyLimit,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.currentUsage < dailyLimit,
        currentUsage: usage.currentUsage,
        remaining: Math.max(0, dailyLimit - usage.currentUsage),
        dailyLimit,
        percentageUsed: (usage.currentUsage / dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Failed to get token status', {
        userId,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        remaining: dailyLimit,
        dailyLimit,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Get usage record for user and date
   */
  private async getUsage(userId: string, date: string): Promise<TokenUsage | null> {
    try {
      const result = await this.dynamoDB.query<TokenUsage>({
        tableName: config.dynamodb.sessionsTable,
        keyConditionExpression: 'userId = :userId AND begins_with(sessionId, :prefix)',
        expressionAttributeValues: {
          ':userId': userId,
          ':prefix': `tokenusage:${userId}:`,
        },
        limit: 1,
      });

      return result.items[0] || null;
    } catch (error) {
      logger.error('Failed to get token usage', {
        userId,
        date,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Reset daily usage (call at start of each day)
   */
  async resetDailyUsage(): Promise<number> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let deletedCount = 0;
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const result = await this.dynamoDB.scan<TokenUsage>({
          tableName: config.dynamodb.sessionsTable,
          filterExpression: 'begins_with(sessionId, :prefix) AND date < :yesterday',
          expressionAttributeValues: {
            ':prefix': 'tokenusage:',
            ':yesterday': yesterdayStr,
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

      logger.info('Token usage records reset', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to reset token usage', {
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Get daily usage report for a user
   */
  async getDailyReport(userId: string, date?: string, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<TokenResult> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const usage = await this.getUsage(userId, targetDate);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          remaining: dailyLimit,
          dailyLimit,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.currentUsage < usage.dailyLimit,
        currentUsage: usage.currentUsage,
        remaining: Math.max(0, usage.dailyLimit - usage.currentUsage),
        dailyLimit: usage.dailyLimit,
        percentageUsed: (usage.currentUsage / usage.dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Failed to get daily report', {
        userId,
        date,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        remaining: dailyLimit,
        dailyLimit,
        percentageUsed: 0,
      };
    }
  }
}

// Export singleton instance
export const tokenTrackerService = new TokenTrackerService();

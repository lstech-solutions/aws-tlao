/**
 * Daily usage tracker service for Free Tier enforcement
 */

import { DynamoDBService } from './dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { DailyUsage } from '../models/types';

/**
 * Daily usage tracking result
 */
export interface DailyUsageResult {
  allowed: boolean;
  currentUsage: number;
  dailyLimit: number;
  remaining: number;
  percentageUsed: number;
}

/**
 * Daily usage tracker service with DynamoDB tracking
 */
export class DailyUsageService {
  private dynamoDB: DynamoDBService;
  private readonly defaultConfig = {
    dailyLimit: 1000, // 1,000 API requests per day
  };

  constructor() {
    this.dynamoDB = new DynamoDBService();
  }

  /**
   * Check if daily usage is allowed and increment
   */
  async trackDailyUsage(userId: string, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<DailyUsageResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Get current usage for today
      const usage = await this.getUsage(userId, today);

      if (usage) {
        const newUsage = usage.apiRequests + 1;

        if (newUsage > dailyLimit) {
          logger.warn('Daily API limit exceeded', {
            userId,
            currentUsage: usage.apiRequests,
            limit: dailyLimit,
          });

          return {
            allowed: false,
            currentUsage: usage.apiRequests,
            dailyLimit,
            remaining: 0,
            percentageUsed: (usage.apiRequests / dailyLimit) * 100,
          };
        }

        // Update usage
        await this.dynamoDB.update({
          tableName: config.dynamodb.sessionsTable,
          key: { sessionId: usage.sessionId },
          updateExpression: 'SET apiRequests = :newUsage, lastUpdated = :now',
          expressionAttributeValues: {
            ':newUsage': newUsage,
            ':now': Date.now(),
          },
        });

        return {
          allowed: true,
          currentUsage: newUsage,
          dailyLimit,
          remaining: dailyLimit - newUsage,
          percentageUsed: (newUsage / dailyLimit) * 100,
        };
      }

      // Create new usage record
      const sessionId = `dailyusage:${userId}:${today}`;
      await this.dynamoDB.put(config.dynamodb.sessionsTable, {
        sessionId,
        userId,
        date: today,
        apiRequests: 1,
        dailyLimit,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      });

      return {
        allowed: true,
        currentUsage: 1,
        dailyLimit,
        remaining: dailyLimit - 1,
        percentageUsed: (1 / dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Daily usage tracking failed', {
        userId,
        error: (error as Error).message,
      });

      // Fail open - allow request if DynamoDB fails
      return {
        allowed: true,
        currentUsage: 1,
        dailyLimit,
        remaining: dailyLimit - 1,
        percentageUsed: (1 / dailyLimit) * 100,
      };
    }
  }

  /**
   * Get current daily usage without incrementing
   */
  async getStatus(userId: string, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<DailyUsageResult> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const usage = await this.getUsage(userId, today);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          dailyLimit,
          remaining: dailyLimit,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.apiRequests < dailyLimit,
        currentUsage: usage.apiRequests,
        dailyLimit,
        remaining: Math.max(0, dailyLimit - usage.apiRequests),
        percentageUsed: (usage.apiRequests / dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Failed to get daily usage status', {
        userId,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        dailyLimit,
        remaining: dailyLimit,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Get usage record for user and date
   */
  private async getUsage(userId: string, date: string): Promise<DailyUsage | null> {
    try {
      const result = await this.dynamoDB.query<DailyUsage>({
        tableName: config.dynamodb.sessionsTable,
        keyConditionExpression: 'userId = :userId AND begins_with(sessionId, :prefix)',
        expressionAttributeValues: {
          ':userId': userId,
          ':prefix': `dailyusage:${userId}:`,
        },
        limit: 1,
      });

      return result.items[0] || null;
    } catch (error) {
      logger.error('Failed to get daily usage', {
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
        const result = await this.dynamoDB.scan<DailyUsage>({
          tableName: config.dynamodb.sessionsTable,
          filterExpression: 'begins_with(sessionId, :prefix) AND date < :yesterday',
          expressionAttributeValues: {
            ':prefix': 'dailyusage:',
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

      logger.info('Daily usage records reset', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to reset daily usage', {
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Get daily usage report for a user
   */
  async getDailyReport(userId: string, date?: string, dailyLimit: number = this.defaultConfig.dailyLimit): Promise<DailyUsageResult> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const usage = await this.getUsage(userId, targetDate);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          dailyLimit,
          remaining: dailyLimit,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.apiRequests < usage.dailyLimit,
        currentUsage: usage.apiRequests,
        dailyLimit: usage.dailyLimit,
        remaining: Math.max(0, usage.dailyLimit - usage.apiRequests),
        percentageUsed: (usage.apiRequests / usage.dailyLimit) * 100,
      };
    } catch (error) {
      logger.error('Failed to get daily usage report', {
        userId,
        date,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        dailyLimit,
        remaining: dailyLimit,
        percentageUsed: 0,
      };
    }
  }
}

// Export singleton instance
export const dailyUsageService = new DailyUsageService();

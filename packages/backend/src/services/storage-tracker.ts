/**
 * Storage tracker service for Free Tier enforcement
 */

import { DynamoDBService } from './dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { StorageUsage } from '../models/types';

/**
 * Storage tracking result
 */
export interface StorageResult {
  allowed: boolean;
  currentUsage: number;
  maxUsage: number;
  remaining: number;
  percentageUsed: number;
}

/**
 * Storage tracker service with DynamoDB tracking
 */
export class StorageTrackerService {
  private dynamoDB: DynamoDBService;
  private readonly defaultConfig = {
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
  };

  constructor() {
    this.dynamoDB = new DynamoDBService();
  }

  /**
   * Check if storage usage is allowed and increment
   */
  async trackStorage(userId: string, bytesAdded: number, maxStorage: number = this.defaultConfig.maxStorage): Promise<StorageResult> {
    try {
      // Get current usage
      const usage = await this.getUsage(userId);

      if (usage) {
        const newUsage = usage.currentUsage + bytesAdded;

        if (newUsage > maxStorage) {
          logger.warn('Storage limit exceeded', {
            userId,
            currentUsage: usage.currentUsage,
            requested: bytesAdded,
            limit: maxStorage,
          });

          return {
            allowed: false,
            currentUsage: usage.currentUsage,
            maxUsage: maxStorage,
            remaining: 0,
            percentageUsed: (usage.currentUsage / maxStorage) * 100,
          };
        }

        // Update usage
        await this.dynamoDB.update({
          tableName: config.dynamodb.sessionsTable,
          key: { userId: usage.userId },
          updateExpression: 'SET currentUsage = :newUsage, lastUpdated = :now',
          expressionAttributeValues: {
            ':newUsage': newUsage,
            ':now': Date.now(),
          },
        });

        return {
          allowed: true,
          currentUsage: newUsage,
          maxUsage: maxStorage,
          remaining: maxStorage - newUsage,
          percentageUsed: (newUsage / maxStorage) * 100,
        };
      }

      // Create new usage record
      const sessionId = `storage:${userId}`;
      await this.dynamoDB.put(config.dynamodb.sessionsTable, {
        sessionId,
        userId,
        currentUsage: bytesAdded,
        maxUsage: maxStorage,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      });

      return {
        allowed: true,
        currentUsage: bytesAdded,
        maxUsage: maxStorage,
        remaining: maxStorage - bytesAdded,
        percentageUsed: (bytesAdded / maxStorage) * 100,
      };
    } catch (error) {
      logger.error('Storage tracking failed', {
        userId,
        bytesAdded,
        error: (error as Error).message,
      });

      // Fail open - allow request if DynamoDB fails
      return {
        allowed: true,
        currentUsage: bytesAdded,
        maxUsage: maxStorage,
        remaining: maxStorage - bytesAdded,
        percentageUsed: (bytesAdded / maxStorage) * 100,
      };
    }
  }

  /**
   * Decrement storage usage (for deletions)
   */
  async decrementStorage(userId: string, bytesRemoved: number, maxStorage: number = this.defaultConfig.maxStorage): Promise<StorageResult> {
    try {
      const usage = await this.getUsage(userId);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          maxUsage: maxStorage,
          remaining: maxStorage,
          percentageUsed: 0,
        };
      }

      const newUsage = Math.max(0, usage.currentUsage - bytesRemoved);

      await this.dynamoDB.update({
        tableName: config.dynamodb.sessionsTable,
        key: { userId: usage.userId },
        updateExpression: 'SET currentUsage = :newUsage, lastUpdated = :now',
        expressionAttributeValues: {
          ':newUsage': newUsage,
          ':now': Date.now(),
        },
      });

      return {
        allowed: true,
        currentUsage: newUsage,
        maxUsage: maxStorage,
        remaining: maxStorage - newUsage,
        percentageUsed: (newUsage / maxStorage) * 100,
      };
    } catch (error) {
      logger.error('Failed to decrement storage', {
        userId,
        bytesRemoved,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        maxUsage: maxStorage,
        remaining: maxStorage,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Get current storage usage without incrementing
   */
  async getStatus(userId: string, maxStorage: number = this.defaultConfig.maxStorage): Promise<StorageResult> {
    try {
      const usage = await this.getUsage(userId);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          maxUsage: maxStorage,
          remaining: maxStorage,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.currentUsage < maxStorage,
        currentUsage: usage.currentUsage,
        maxUsage: maxStorage,
        remaining: Math.max(0, maxStorage - usage.currentUsage),
        percentageUsed: (usage.currentUsage / maxStorage) * 100,
      };
    } catch (error) {
      logger.error('Failed to get storage status', {
        userId,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        maxUsage: this.defaultConfig.maxStorage,
        remaining: this.defaultConfig.maxStorage,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Get usage record for user
   */
  private async getUsage(userId: string): Promise<StorageUsage | null> {
    try {
      const result = await this.dynamoDB.query<StorageUsage>({
        tableName: config.dynamodb.sessionsTable,
        keyConditionExpression: 'userId = :userId AND begins_with(sessionId, :prefix)',
        expressionAttributeValues: {
          ':userId': userId,
          ':prefix': `storage:${userId}:`,
        },
        limit: 1,
      });

      return result.items[0] || null;
    } catch (error) {
      logger.error('Failed to get storage usage', {
        userId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Get storage usage report for a user
   */
  async getUsageReport(userId: string, maxStorage: number = this.defaultConfig.maxStorage): Promise<StorageResult> {
    try {
      const usage = await this.getUsage(userId);

      if (!usage) {
        return {
          allowed: true,
          currentUsage: 0,
          maxUsage: maxStorage,
          remaining: maxStorage,
          percentageUsed: 0,
        };
      }

      return {
        allowed: usage.currentUsage < usage.maxUsage,
        currentUsage: usage.currentUsage,
        maxUsage: usage.maxUsage,
        remaining: Math.max(0, usage.maxUsage - usage.currentUsage),
        percentageUsed: (usage.currentUsage / usage.maxUsage) * 100,
      };
    } catch (error) {
      logger.error('Failed to get usage report', {
        userId,
        error: (error as Error).message,
      });

      return {
        allowed: true,
        currentUsage: 0,
        maxUsage: this.defaultConfig.maxStorage,
        remaining: this.defaultConfig.maxStorage,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Convert bytes to human-readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// Export singleton instance
export const storageTrackerService = new StorageTrackerService();

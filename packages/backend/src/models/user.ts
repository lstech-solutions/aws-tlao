/**
 * User model with CRUD operations
 */

import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { User, OrganizationType, Language } from './types';

/**
 * User creation parameters
 */
export interface CreateUserParams {
  email: string;
  organizationType: OrganizationType;
  preferences?: {
    language?: Language;
    timezone?: string;
    notificationEmail?: string;
  };
}

/**
 * User update parameters
 */
export interface UpdateUserParams {
  email?: string;
  organizationType?: OrganizationType;
  preferences?: {
    language?: Language;
    timezone?: string;
    notificationEmail?: string;
  };
}

/**
 * User model class with DynamoDB operations
 */
export class UserModel {
  /**
   * Create a new user
   */
  static async create(params: CreateUserParams): Promise<User> {
    const userId = uuidv4();
    const now = Date.now();

    const user: User = {
      userId,
      email: params.email,
      organizationType: params.organizationType,
      createdAt: now,
      lastActiveAt: now,
      preferences: {
        language: params.preferences?.language || 'en',
        timezone: params.preferences?.timezone || 'UTC',
        notificationEmail: params.preferences?.notificationEmail,
      },
    };

    try {
      await dynamoDBService.put(config.dynamodb.usersTable, user);
      logger.info('User created successfully', { userId, email: params.email });
      return user;
    } catch (error) {
      logger.error('Failed to create user', { email: params.email, error: (error as Error).message });
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getById(userId: string): Promise<User | null> {
    try {
      const user = await dynamoDBService.get<User>(config.dynamodb.usersTable, { userId });
      
      if (user) {
        logger.debug('User retrieved by ID', { userId });
      } else {
        logger.debug('User not found by ID', { userId });
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', { userId, error: (error as Error).message });
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<User | null> {
    try {
      const result = await dynamoDBService.query<User>({
        tableName: config.dynamodb.usersTable,
        indexName: 'EmailIndex',
        keyConditionExpression: 'email = :email',
        expressionAttributeValues: {
          ':email': email,
        },
        limit: 1,
      });

      const user = result.items[0] || null;
      
      if (user) {
        logger.debug('User retrieved by email', { email, userId: user.userId });
      } else {
        logger.debug('User not found by email', { email });
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by email', { email, error: (error as Error).message });
      throw new Error(`Failed to get user by email: ${(error as Error).message}`);
    }
  }

  /**
   * Update user
   */
  static async update(userId: string, params: UpdateUserParams): Promise<User> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      // Build update expression dynamically
      if (params.email !== undefined) {
        updateExpressions.push('#email = :email');
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = params.email;
      }

      if (params.organizationType !== undefined) {
        updateExpressions.push('organizationType = :organizationType');
        expressionAttributeValues[':organizationType'] = params.organizationType;
      }

      if (params.preferences !== undefined) {
        updateExpressions.push('preferences = :preferences');
        expressionAttributeValues[':preferences'] = params.preferences;
      }

      // Always update lastActiveAt
      updateExpressions.push('lastActiveAt = :lastActiveAt');
      expressionAttributeValues[':lastActiveAt'] = Date.now();

      if (updateExpressions.length === 1) {
        // Only lastActiveAt was updated
        throw new Error('No fields to update');
      }

      const updateExpression = `SET ${updateExpressions.join(', ')}`;

      const updatedUser = await dynamoDBService.update<User>({
        tableName: config.dynamodb.usersTable,
        key: { userId },
        updateExpression,
        expressionAttributeValues,
        expressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      });

      logger.info('User updated successfully', { userId });
      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user', { userId, error: (error as Error).message });
      throw new Error(`Failed to update user: ${(error as Error).message}`);
    }
  }

  /**
   * Update user's last active timestamp
   */
  static async updateLastActive(userId: string): Promise<void> {
    try {
      await dynamoDBService.update({
        tableName: config.dynamodb.usersTable,
        key: { userId },
        updateExpression: 'SET lastActiveAt = :lastActiveAt',
        expressionAttributeValues: {
          ':lastActiveAt': Date.now(),
        },
      });

      logger.debug('User last active updated', { userId });
    } catch (error) {
      logger.error('Failed to update user last active', { userId, error: (error as Error).message });
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Delete user
   */
  static async delete(userId: string): Promise<void> {
    try {
      await dynamoDBService.delete(config.dynamodb.usersTable, { userId });
      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete user', { userId, error: (error as Error).message });
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  /**
   * Check if user exists
   */
  static async exists(userId: string): Promise<boolean> {
    try {
      const user = await this.getById(userId);
      return user !== null;
    } catch (error) {
      logger.error('Failed to check if user exists', { userId, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Validate user data
   */
  static validate(user: Partial<User>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (user.email && !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    if (user.organizationType && !['founder', 'ngo', 'startup'].includes(user.organizationType)) {
      errors.push('Invalid organization type');
    }

    if (user.preferences?.language && !['en', 'es', 'pt'].includes(user.preferences.language)) {
      errors.push('Invalid language preference');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
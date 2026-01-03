/**
 * DynamoDB client wrapper with CRUD operations
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

/**
 * Query parameters for DynamoDB operations
 */
export interface QueryParams {
  tableName: string;
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  indexName?: string;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
  scanIndexForward?: boolean;
}

/**
 * Scan parameters for DynamoDB operations
 */
export interface ScanParams {
  tableName: string;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
}

/**
 * Update parameters for DynamoDB operations
 */
export interface UpdateParams {
  tableName: string;
  key: Record<string, any>;
  updateExpression: string;
  expressionAttributeValues: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
}

/**
 * DynamoDB client wrapper with retry logic and error handling
 */
export class DynamoDBService {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private maxRetries: number = 3;
  private baseDelayMs: number = 100;

  constructor() {
    this.client = new DynamoDBClient({ region: config.aws.region });
    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
  }

  /**
   * Put an item into DynamoDB with retry logic
   */
  async put(tableName: string, item: Record<string, any>): Promise<void> {
    return this.withRetry(async () => {
      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await this.docClient.send(command);
      logger.debug('Item put successfully', { tableName, itemKeys: Object.keys(item) });
    });
  }

  /**
   * Get an item from DynamoDB with retry logic
   */
  async get<T = any>(tableName: string, key: Record<string, any>): Promise<T | null> {
    return this.withRetry(async () => {
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
      });

      const response = await this.docClient.send(command);
      
      if (!response.Item) {
        logger.debug('Item not found', { tableName, key });
        return null;
      }

      logger.debug('Item retrieved successfully', { tableName, key });
      return response.Item as T;
    });
  }

  /**
   * Query items from DynamoDB with retry logic
   */
  async query<T = any>(params: QueryParams): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    return this.withRetry(async () => {
      const command = new QueryCommand({
        TableName: params.tableName,
        KeyConditionExpression: params.keyConditionExpression,
        ExpressionAttributeValues: params.expressionAttributeValues,
        ExpressionAttributeNames: params.expressionAttributeNames,
        IndexName: params.indexName,
        Limit: params.limit,
        ExclusiveStartKey: params.exclusiveStartKey,
        ScanIndexForward: params.scanIndexForward,
      });

      const response = await this.docClient.send(command);
      
      logger.debug('Query executed successfully', {
        tableName: params.tableName,
        itemCount: response.Items?.length || 0,
      });

      return {
        items: (response.Items || []) as T[],
        lastEvaluatedKey: response.LastEvaluatedKey,
      };
    });
  }

  /**
   * Scan items from DynamoDB with retry logic
   */
  async scan<T = any>(params: ScanParams): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    return this.withRetry(async () => {
      const command = new ScanCommand({
        TableName: params.tableName,
        FilterExpression: params.filterExpression,
        ExpressionAttributeValues: params.expressionAttributeValues,
        ExpressionAttributeNames: params.expressionAttributeNames,
        Limit: params.limit,
        ExclusiveStartKey: params.exclusiveStartKey,
      });

      const response = await this.docClient.send(command);
      
      logger.debug('Scan executed successfully', {
        tableName: params.tableName,
        itemCount: response.Items?.length || 0,
      });

      return {
        items: (response.Items || []) as T[],
        lastEvaluatedKey: response.LastEvaluatedKey,
      };
    });
  }

  /**
   * Update an item in DynamoDB with retry logic
   */
  async update<T = any>(params: UpdateParams): Promise<T> {
    return this.withRetry(async () => {
      const command = new UpdateCommand({
        TableName: params.tableName,
        Key: params.key,
        UpdateExpression: params.updateExpression,
        ExpressionAttributeValues: params.expressionAttributeValues,
        ExpressionAttributeNames: params.expressionAttributeNames,
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.docClient.send(command);
      
      logger.debug('Item updated successfully', {
        tableName: params.tableName,
        key: params.key,
      });

      return response.Attributes as T;
    });
  }

  /**
   * Delete an item from DynamoDB with retry logic
   */
  async delete(tableName: string, key: Record<string, any>): Promise<void> {
    return this.withRetry(async () => {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
      });

      await this.docClient.send(command);
      logger.debug('Item deleted successfully', { tableName, key });
    });
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const command = new DescribeTableCommand({ TableName: tableName });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delayMs = this.baseDelayMs * Math.pow(2, attempt);
        
        logger.warn(`DynamoDB operation failed, retrying in ${delayMs}ms`, {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          error: (error as Error).message,
        });

        await this.sleep(delayMs);
      }
    }

    logger.error('DynamoDB operation failed after all retries', {
      maxRetries: this.maxRetries,
      error: lastError?.message,
    });

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableErrors = [
      'ValidationException',
      'ResourceNotFoundException',
      'ConditionalCheckFailedException',
    ];

    return nonRetryableErrors.includes(error.name);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close the client connection
   */
  destroy(): void {
    this.client.destroy();
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();

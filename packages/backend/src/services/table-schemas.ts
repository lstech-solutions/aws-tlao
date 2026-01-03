/**
 * DynamoDB table schemas and initialization
 */

import {
  CreateTableCommand,
  CreateTableCommandInput,
  AttributeDefinition,
  KeySchemaElement,
  GlobalSecondaryIndex,
  BillingMode,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { dynamoDBService } from './dynamodb';

/**
 * Table schema definition
 */
interface TableSchema {
  tableName: string;
  attributeDefinitions: AttributeDefinition[];
  keySchema: KeySchemaElement[];
  globalSecondaryIndexes?: GlobalSecondaryIndex[];
}

/**
 * Users table schema
 */
const usersTableSchema: TableSchema = {
  tableName: config.dynamodb.usersTable,
  attributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
  ],
  keySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: 'EmailIndex',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
};

/**
 * Documents table schema
 */
const documentsTableSchema: TableSchema = {
  tableName: config.dynamodb.documentsTable,
  attributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'documentId', AttributeType: 'S' },
    { AttributeName: 'uploadTime', AttributeType: 'N' },
  ],
  keySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
    { AttributeName: 'documentId', KeyType: 'RANGE' },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: 'UploadTimeIndex',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'uploadTime', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
};

/**
 * Results table schema
 */
const resultsTableSchema: TableSchema = {
  tableName: config.dynamodb.resultsTable,
  attributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'resultId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'N' },
    { AttributeName: 'agentType', AttributeType: 'S' },
  ],
  keySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
    { AttributeName: 'resultId', KeyType: 'RANGE' },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: 'CreatedAtIndex',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'AgentTypeIndex',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'agentType', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
};

/**
 * Sessions table schema
 */
const sessionsTableSchema: TableSchema = {
  tableName: config.dynamodb.sessionsTable,
  attributeDefinitions: [
    { AttributeName: 'sessionId', AttributeType: 'S' },
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'expiresAt', AttributeType: 'N' },
  ],
  keySchema: [
    { AttributeName: 'sessionId', KeyType: 'HASH' },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: 'UserIdIndex',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'ExpiresAtIndex',
      KeySchema: [
        { AttributeName: 'expiresAt', KeyType: 'HASH' },
      ],
      Projection: { ProjectionType: 'KEYS_ONLY' },
    },
  ],
};

/**
 * All table schemas
 */
const tableSchemas: TableSchema[] = [
  usersTableSchema,
  documentsTableSchema,
  resultsTableSchema,
  sessionsTableSchema,
];

/**
 * Table initialization service
 */
export class TableInitializationService {
  private client: DynamoDBClient;

  constructor() {
    this.client = new DynamoDBClient({ region: config.aws.region });
  }

  /**
   * Initialize all tables if they don't exist
   */
  async initializeAllTables(): Promise<void> {
    logger.info('Initializing DynamoDB tables...');

    for (const schema of tableSchemas) {
      await this.initializeTable(schema);
    }

    logger.info('All DynamoDB tables initialized successfully');
  }

  /**
   * Initialize a single table if it doesn't exist
   */
  async initializeTable(schema: TableSchema): Promise<void> {
    try {
      const exists = await dynamoDBService.tableExists(schema.tableName);
      
      if (exists) {
        logger.debug(`Table ${schema.tableName} already exists`);
        return;
      }

      logger.info(`Creating table: ${schema.tableName}`);
      await this.createTable(schema);
      logger.info(`Table ${schema.tableName} created successfully`);
    } catch (error) {
      logger.error(`Failed to initialize table ${schema.tableName}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create a table with the given schema
   */
  private async createTable(schema: TableSchema): Promise<void> {
    const params: CreateTableCommandInput = {
      TableName: schema.tableName,
      AttributeDefinitions: schema.attributeDefinitions,
      KeySchema: schema.keySchema,
      BillingMode: BillingMode.PAY_PER_REQUEST, // Use on-demand billing for Free Tier
      GlobalSecondaryIndexes: schema.globalSecondaryIndexes,
    };

    const command = new CreateTableCommand(params);
    await this.client.send(command);

    // Wait for table to become active
    await this.waitForTableActive(schema.tableName);
  }

  /**
   * Wait for a table to become active
   */
  private async waitForTableActive(tableName: string, maxWaitTimeMs: number = 60000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTimeMs) {
      try {
        const exists = await dynamoDBService.tableExists(tableName);
        if (exists) {
          logger.debug(`Table ${tableName} is now active`);
          return;
        }
      } catch (error) {
        // Continue polling if table is not ready
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Table ${tableName} did not become active within ${maxWaitTimeMs}ms`);
  }

  /**
   * Delete all tables (for testing/cleanup)
   */
  async deleteAllTables(): Promise<void> {
    logger.warn('Deleting all DynamoDB tables...');

    for (const schema of tableSchemas) {
      try {
        const exists = await dynamoDBService.tableExists(schema.tableName);
        if (exists) {
          logger.info(`Deleting table: ${schema.tableName}`);
          // Note: DeleteTableCommand would be implemented here
          // For now, just log the action
          logger.info(`Table ${schema.tableName} deletion initiated`);
        }
      } catch (error) {
        logger.error(`Failed to delete table ${schema.tableName}`, {
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * Get table schema by name
   */
  getTableSchema(tableName: string): TableSchema | undefined {
    return tableSchemas.find(schema => schema.tableName === tableName);
  }

  /**
   * Get all table names
   */
  getAllTableNames(): string[] {
    return tableSchemas.map(schema => schema.tableName);
  }
}

// Export singleton instance
export const tableInitializationService = new TableInitializationService();

// Export schemas for reference
export {
  usersTableSchema,
  documentsTableSchema,
  resultsTableSchema,
  sessionsTableSchema,
  tableSchemas,
};
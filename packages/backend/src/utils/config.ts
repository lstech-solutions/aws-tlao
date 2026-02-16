/**
 * Configuration management for the AI Agent Platform
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Free Tier limits configuration
 */
export interface FreeTierLimits {
  tokenLimit: number; // 100,000 tokens/user/day
  storageCap: number; // 5GB per user
  rateLimit: number; // 100 requests/minute per user
  dailyLimit: number; // 1,000 API requests/user/day
}

/**
 * Application configuration
 */
export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accountId: process.env.AWS_ACCOUNT_ID || '',
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
  },
  dynamodb: {
    usersTable: process.env.DYNAMODB_USERS_TABLE || 'ai-agent-platform-users',
    documentsTable: process.env.DYNAMODB_DOCUMENTS_TABLE || 'ai-agent-platform-documents',
    resultsTable: process.env.DYNAMODB_RESULTS_TABLE || 'ai-agent-platform-results',
    sessionsTable: process.env.DYNAMODB_SESSIONS_TABLE || 'ai-agent-platform-sessions',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'ai-agent-platform-documents',
    region: process.env.S3_REGION || 'us-east-1',
  },
  api: {
    keyHashSecret: process.env.API_KEY_HASH_SECRET || 'default-secret-change-me',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  freeTier: {
    tokenLimit: parseInt(process.env.FREE_TIER_TOKEN_LIMIT || '100000', 10),
    storageCap: parseInt(process.env.FREE_TIER_STORAGE_CAP || '5368709120', 10), // 5GB in bytes
    rateLimit: parseInt(process.env.FREE_TIER_RATE_LIMIT || '100', 10),
    dailyLimit: parseInt(process.env.FREE_TIER_DAILY_LIMIT || '1000', 10),
  } as FreeTierLimits,
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const required = [
    'AWS_REGION',
    'BEDROCK_MODEL_ID',
    'DYNAMODB_USERS_TABLE',
    'DYNAMODB_DOCUMENTS_TABLE',
    'DYNAMODB_RESULTS_TABLE',
    'DYNAMODB_SESSIONS_TABLE',
    'S3_BUCKET_NAME',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. Set these in .env for production.');
  }
}

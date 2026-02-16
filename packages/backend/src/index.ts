/**
 * Main entry point for the TLÁO Autonomous Agent Platform
 */

import { validateConfig } from './utils/config';
import { logger } from './utils/logger';

// Export services
export { bedrockService } from './services/bedrock';
export { dynamoDBService } from './services/dynamodb';
export { s3Service } from './services/s3';
export { transcribeService } from './services/transcribe';
export { rateLimiterService } from './services/rate-limiter';
export { tokenTrackerService } from './services/token-tracker';
export { storageTrackerService } from './services/storage-tracker';
export { dailyUsageService } from './services/daily-usage';
export { agentOrchestratorService } from './services/agent-orchestrator';

// Export agents
export { TlaoPlanAgent } from './agents/tlao-plan';
export { TlaoGrantAgent } from './agents/tlao-grant';

// Export models
export { DocumentModel } from './models/document';
export { SessionModel } from './models/session';
export { UserModel } from './models/user';

// Export utilities
export { logger } from './utils/logger';
export { config } from './utils/config';
export { AppError, ErrorType, formatErrorResponse, logError } from './utils/errors';

/**
 * Initialize the application
 */
export async function initialize(): Promise<void> {
  logger.info('Initializing TLÁO Autonomous Agent Platform...');

  // Validate configuration
  validateConfig();

  logger.info('TLÁO Autonomous Agent Platform initialized successfully');
}

// Run initialization if this is the main module
if (require.main === module) {
  initialize()
    .then(() => {
      logger.info('Application started');
    })
    .catch((error) => {
      logger.error('Failed to start application', { error: error.message });
      process.exit(1);
    });
}

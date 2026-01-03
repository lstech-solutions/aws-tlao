/**
 * Main entry point for the AI Agent Platform
 */

import { validateConfig } from './utils/config';
import { logger } from './utils/logger';

/**
 * Initialize the application
 */
export async function initialize(): Promise<void> {
  logger.info('Initializing AI Agent Platform...');
  
  // Validate configuration
  validateConfig();
  
  logger.info('AI Agent Platform initialized successfully');
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

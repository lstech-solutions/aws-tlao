// Services
export { StalwartClient } from './services/stalwart-client';
export { MailboxService } from './services/mailbox-service';
export { JMAPIngestionService } from './services/jmap-ingestion';
export { BedrockClient, bedrockClient } from './services/bedrock-client';
export { IntakeProcessor } from './services/intake-processor';
export { RunService, runService } from './services/run-service';
export { ArtifactService, artifactService } from './services/artifact-service';
export { DNSConfigService, dnsConfigService } from './services/dns-config';
export { PrivacyService, privacyService } from './services/privacy-service';
export { OutcomeLinkingService, outcomeLinkingService } from './services/outcome-linking';
export { CostTracker, costTracker } from './services/cost-tracker';

// API Handlers
export { AutodiscoverHandler } from './api/autodiscover-handler';
export { MailboxHandler } from './api/mailbox-handler';
export { InboxHandler, inboxHandler } from './api/inbox-handler';
export { handleCheckOptIn, handleSetOptIn } from './api/privacy-handler';

// Types
export * from './types/mail-message';
export * from './types/mailbox';
export * from './types/classification';
export * from './types/run';

// Libraries
export { DynamoDBService, dynamoDBService } from './lib/dynamodb';
export { S3Service, s3Service } from './lib/s3';
export { RateLimiter, rateLimiter } from './lib/rate-limiter';

// Lambda Handlers
export { handler as emailParserHandler } from './lambdas/email-parser';

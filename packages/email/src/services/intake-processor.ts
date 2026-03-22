import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { MailMessage } from '../types/mail-message';
import { EmailRun } from '../types/run';
import { PLAN_CLASSIFICATIONS, GRANT_CLASSIFICATIONS } from '../types/classification';
import { dynamoDBService } from '../lib/dynamodb';
import { rateLimiter } from '../lib/rate-limiter';
import { bedrockClient } from './bedrock-client';
import { costTracker } from './cost-tracker';
import { artifactService } from './artifact-service';
import { runService } from './run-service';
import { privacyService } from './privacy-service';

const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION || 'us-east-1' });

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export class IntakeProcessor {
  private backendApiUrl: string;
  private backendApiKey: string;
  private retryConfig: RetryConfig;

  constructor(backendApiUrl: string, backendApiKey: string) {
    this.backendApiUrl = backendApiUrl;
    this.backendApiKey = backendApiKey;
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 5000,
    };
  }

  private logToCloudWatch(
    logGroup: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      message,
      context,
    };
    console.log(`[${logGroup}] ${JSON.stringify(logMessage)}`);
  }

  private async exponentialBackoffRetry<T>(
    fn: () => Promise<T>,
    context: string,
    workspaceId: string,
    messageId: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryConfig.maxRetries) {
          const delayMs = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(2, attempt),
            this.retryConfig.maxDelayMs
          );
          this.logToCloudWatch('intake-processor', `Retry attempt ${attempt + 1}`, {
            context,
            workspaceId,
            messageId,
            delayMs,
            error: lastError.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  async processNewEmail(workspaceId: string, messageId: string): Promise<void> {
    try {
      this.logToCloudWatch('intake-processor', 'Starting email processing', {
        workspaceId,
        messageId,
      });

      // Check rate limit
      if (!rateLimiter.checkLimit(workspaceId)) {
        this.logToCloudWatch('intake-processor', 'Rate limit exceeded, queuing email', {
          workspaceId,
          messageId,
        });

        await dynamoDBService.update(
          'tlao-email-messages',
          { workspaceId, messageId },
          'SET #status = :queued',
          { ':queued': 'queued', '#status': 'status' }
        );
        return;
      }

      // Retrieve MailMessage
      const mailMessage = (await dynamoDBService.get('tlao-email-messages', {
        workspaceId,
        messageId,
      })) as MailMessage;

      if (!mailMessage) {
        throw new Error('MailMessage not found');
      }

      // Check privacy controls for personal mailboxes
      if (mailMessage.ingestionMode === 'personal') {
        const mailboxId = mailMessage.mailbox;

        const hasOptedIn = await privacyService.checkOptIn(workspaceId, mailboxId);

        if (!hasOptedIn) {
          this.logToCloudWatch('intake-processor', 'Personal email skipped - user has not opted in', {
            workspaceId,
            messageId,
            mailbox: mailMessage.mailbox,
          });

          // Set status to needs_review instead of processing
          await dynamoDBService.update(
            'tlao-email-messages',
            { workspaceId, messageId },
            'SET #status = :needsReview',
            { ':needsReview': 'needs_review', '#status': 'status' }
          );
          return;
        }

        this.logToCloudWatch('intake-processor', 'Personal email processing with privacy controls', {
          workspaceId,
          messageId,
          mailbox: mailMessage.mailbox,
        });
      }

      // Truncate body for classification
      const truncatedBody = mailMessage.bodyText.substring(0, 10000);

      // Classify email with retry
      let classification;
      try {
        classification = await this.exponentialBackoffRetry(
          () => bedrockClient.classifyEmail(mailMessage.subject, truncatedBody),
          'Bedrock classification',
          workspaceId,
          messageId
        );

        // Track Bedrock cost
        await costTracker.trackOperation({
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          service: 'bedrock',
          operation: 'classification',
          estimatedCostUsd: 0.002,
          units: 1,
        });
      } catch (error) {
        this.logToCloudWatch('intake-processor', 'Classification failed after retries', {
          workspaceId,
          messageId,
          error: (error as Error).message,
          stage: 'classification',
        });

        await dynamoDBService.update(
          'tlao-email-messages',
          { workspaceId, messageId },
          'SET #status = :error',
          { ':error': 'processing_error', '#status': 'status' }
        );
        return;
      }

      // Update MailMessage with classification
      await dynamoDBService.update(
        'tlao-email-messages',
        { workspaceId, messageId },
        'SET classification = :classification, classificationConfidence = :confidence',
        {
          ':classification': classification.classification,
          ':confidence': classification.confidence,
        }
      );

      this.logToCloudWatch('intake-processor', 'Email classified', {
        workspaceId,
        messageId,
        classification: classification.classification,
        confidence: classification.confidence,
      });

      // Check confidence
      if (classification.confidence < 0.6) {
        this.logToCloudWatch('intake-processor', 'Low confidence classification, marking for review', {
          workspaceId,
          messageId,
          confidence: classification.confidence,
        });

        await dynamoDBService.update(
          'tlao-email-messages',
          { workspaceId, messageId },
          'SET #status = :needsReview',
          { ':needsReview': 'needs_review', '#status': 'status' }
        );
        return;
      }

      // Determine agent type
      const agentType = PLAN_CLASSIFICATIONS.includes(classification.classification)
        ? 'PLAN'
        : 'GRANT';

      // Create EmailRun
      const runId = uuidv4();
      const emailRun: EmailRun = {
        workspaceId,
        runId,
        agentType,
        source: 'EMAIL',
        sourceMessageId: messageId,
        status: 'pending',
        createdAt: Date.now(),
      };

      await dynamoDBService.put('tlao-email-runs', emailRun);

      this.logToCloudWatch('intake-processor', 'Created EmailRun', {
        workspaceId,
        messageId,
        runId,
        agentType,
      });

      // Call Backend API with retry
      let agentResponse;
      try {
        agentResponse = await this.exponentialBackoffRetry(
          () =>
            this.callBackendAPI({
              agentType,
              source: 'EMAIL',
              sourceMessageId: messageId,
              emailContent: {
                from: mailMessage.fromAddress,
                subject: mailMessage.subject,
                body: truncatedBody,
              },
            }),
          'Backend API call',
          workspaceId,
          messageId
        );

        // Track Bedrock agent cost
        await costTracker.trackOperation({
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          service: 'bedrock',
          operation: 'agent_execution',
          estimatedCostUsd: 0.01,
          units: 1,
        });
      } catch (error) {
        this.logToCloudWatch('intake-processor', 'Backend API call failed after retries', {
          workspaceId,
          messageId,
          runId,
          error: (error as Error).message,
          stage: 'backend_api',
        });

        // Update run with error status
        await runService.failRun(workspaceId, runId, (error as Error).message);

        await dynamoDBService.update(
          'tlao-email-messages',
          { workspaceId, messageId },
          'SET #status = :error',
          { ':error': 'processing_error', '#status': 'status' }
        );
        return;
      }

      // Update run with backend run ID
      await dynamoDBService.update(
        'tlao-email-runs',
        { workspaceId, runId },
        'SET backendRunId = :backendRunId, #status = :running, tokensUsed = :tokens',
        {
          ':backendRunId': agentResponse.runId,
          ':running': 'running',
          ':tokens': agentResponse.tokensUsed || 0,
        }
      );

      this.logToCloudWatch('intake-processor', 'Backend API call succeeded', {
        workspaceId,
        messageId,
        runId,
        backendRunId: agentResponse.runId,
      });

      // Store artifacts
      if (agentResponse.artifacts && agentResponse.artifacts.length > 0) {
        for (const artifact of agentResponse.artifacts) {
          try {
            await artifactService.createArtifact(
              runId,
              artifact.type,
              artifact.content,
              { sourceMessageId: messageId }
            );

            // Track S3 cost for artifact storage
            await costTracker.trackOperation({
              workspaceId,
              date: new Date().toISOString().split('T')[0],
              service: 's3',
              operation: 'put_object',
              estimatedCostUsd: 0.000005,
              units: 1,
            });
          } catch (artifactError) {
            this.logToCloudWatch('intake-processor', 'Failed to store artifact', {
              workspaceId,
              messageId,
              runId,
              artifactId: artifact.artifactId,
              error: (artifactError as Error).message,
            });
          }
        }
      }

      // Complete run
      await runService.completeRun(workspaceId, runId);

      // Update MailMessage
      await dynamoDBService.update(
        'tlao-email-messages',
        { workspaceId, messageId },
        'SET #status = :processed, linkedRunId = :runId',
        {
          ':processed': 'processed',
          ':runId': runId,
        }
      );

      this.logToCloudWatch('intake-processor', 'Email processed successfully', {
        workspaceId,
        messageId,
        runId,
      });
    } catch (error) {
      this.logToCloudWatch('intake-processor', 'Unexpected error processing email', {
        workspaceId,
        messageId,
        error: (error as Error).message,
        stage: 'unknown',
      });

      try {
        await dynamoDBService.update(
          'tlao-email-messages',
          { workspaceId, messageId },
          'SET #status = :error',
          { ':error': 'processing_error', '#status': 'status' }
        );
      } catch (updateError) {
        this.logToCloudWatch('intake-processor', 'Failed to update message status', {
          workspaceId,
          messageId,
          error: (updateError as Error).message,
        });
      }
    }
  }

  private async callBackendAPI(request: any): Promise<any> {
    const response = await fetch(`${this.backendApiUrl}/api/agents/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.backendApiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

import * as AWS from 'aws-sdk';
import { dynamoDBService } from '../lib/dynamodb';

interface OptInRecord {
  workspaceId: string;
  mailboxId: string;
  optedIn: boolean;
  createdAt: number;
  updatedAt: number;
}

const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION || 'us-east-1' });

export class PrivacyService {
  private tableName = 'tlao-email-privacy-optin';

  /**
   * Check if a user has opted in for personal mailbox ingestion
   * @param workspaceId - The workspace ID
   * @param mailboxId - The mailbox ID
   * @returns true if user has opted in, false otherwise
   */
  async checkOptIn(workspaceId: string, mailboxId: string): Promise<boolean> {
    try {
      const record = (await dynamoDBService.get(this.tableName, {
        workspaceId,
        mailboxId,
      })) as OptInRecord | null;

      const optedIn = record?.optedIn ?? false;

      this.logToCloudWatch('privacy-service', 'Checked opt-in status', {
        workspaceId,
        mailboxId,
        optedIn,
      });

      return optedIn;
    } catch (error) {
      this.logToCloudWatch('privacy-service', 'Error checking opt-in status', {
        workspaceId,
        mailboxId,
        error: (error as Error).message,
      });
      // Default to false (no opt-in) on error for safety
      return false;
    }
  }

  /**
   * Set opt-in preference for a user
   * @param workspaceId - The workspace ID
   * @param mailboxId - The mailbox ID
   * @param optedIn - Whether the user is opting in or out
   */
  async setOptIn(
    workspaceId: string,
    mailboxId: string,
    optedIn: boolean
  ): Promise<void> {
    try {
      const now = Date.now();
      const record: OptInRecord = {
        workspaceId,
        mailboxId,
        optedIn,
        createdAt: now,
        updatedAt: now,
      };

      await dynamoDBService.put(this.tableName, record);

      this.logToCloudWatch('privacy-service', 'Updated opt-in preference', {
        workspaceId,
        mailboxId,
        optedIn,
      });
    } catch (error) {
      this.logToCloudWatch('privacy-service', 'Error updating opt-in preference', {
        workspaceId,
        mailboxId,
        optedIn,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Apply privacy controls to email body based on opt-in status
   * For personal emails without opt-in: return placeholder
   * For personal emails with opt-in: return body (no content analysis will be done)
   * @param bodyText - The email body text
   * @param optedIn - Whether user has opted in
   * @returns The body text or placeholder
   */
  applyPrivacyControls(bodyText: string, optedIn: boolean): string {
    if (!optedIn) {
      return '(content hidden - user has not opted in to personal email ingestion)';
    }
    return bodyText;
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
}

export const privacyService = new PrivacyService();

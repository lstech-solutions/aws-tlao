import { MailMessage } from '../types/mail-message';
import { dynamoDBService } from '../lib/dynamodb';

export class InboxHandler {
  async listInbox(
    workspaceId: string,
    limit: number = 20,
    offset: number = 0,
    status?: string,
    mailbox?: string
  ): Promise<{ messages: MailMessage[]; total: number }> {
    let keyCondition = 'workspaceId = :workspaceId';
    let expressionValues: Record<string, unknown> = { ':workspaceId': workspaceId };
    let indexName = 'ReceivedAtIndex';

    if (status) {
      keyCondition = 'workspaceId = :workspaceId AND #status = :status';
      expressionValues[':status'] = status;
      indexName = 'StatusIndex';
    } else if (mailbox) {
      keyCondition = 'workspaceId = :workspaceId AND mailbox = :mailbox';
      expressionValues[':mailbox'] = mailbox;
      indexName = 'MailboxIndex';
    }

    const result = await dynamoDBService.query(
      'tlao-email-messages',
      keyCondition,
      expressionValues,
      indexName,
      limit
    );

    return {
      messages: (result.items as MailMessage[]).sort(
        (a, b) => b.receivedAt - a.receivedAt
      ),
      total: result.items.length,
    };
  }

  async getMessage(workspaceId: string, messageId: string): Promise<MailMessage | null> {
    const message = (await dynamoDBService.get('tlao-email-messages', {
      workspaceId,
      messageId,
    })) as MailMessage | null;

    return message;
  }
}

export const inboxHandler = new InboxHandler();

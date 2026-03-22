import { Mailbox } from '../types/mailbox';
import { MailboxService } from '../services/mailbox-service';

export class MailboxHandler {
  private mailboxService: MailboxService;

  constructor(mailboxService: MailboxService) {
    this.mailboxService = mailboxService;
  }

  async createMailbox(
    workspaceId: string,
    name: string,
    domain: string,
    ingestionMode: 'operational' | 'opportunity' | 'personal'
  ): Promise<Mailbox> {
    return this.mailboxService.createMailbox(workspaceId, name, domain, ingestionMode);
  }

  async deleteMailbox(workspaceId: string, mailboxId: string): Promise<void> {
    return this.mailboxService.deleteMailbox(workspaceId, mailboxId);
  }

  async listMailboxes(workspaceId: string): Promise<Mailbox[]> {
    return this.mailboxService.listMailboxes(workspaceId);
  }

  async getMailbox(workspaceId: string, mailboxId: string): Promise<Mailbox | null> {
    const mailboxes = await this.mailboxService.listMailboxes(workspaceId);
    return mailboxes.find((m) => m.mailboxId === mailboxId) || null;
  }
}

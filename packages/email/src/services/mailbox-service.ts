import { v4 as uuidv4 } from 'uuid'
import { Mailbox, ProvisioningResult, IngestionMode } from '../types/mailbox'
import { StalwartClient } from './stalwart-client'
import { dynamoDBService } from '../lib/dynamodb'

export class MailboxService {
  private stalwartClient: StalwartClient
  private stalwartHostname: string

  constructor(
    stalwartUrl: string,
    stalwartApiCredential: string,
    stalwartHostname: string,
    stalwartApiSecret?: string
  ) {
    this.stalwartClient = new StalwartClient(stalwartUrl, stalwartApiCredential, stalwartApiSecret)
    this.stalwartHostname = stalwartHostname
  }

  async createMailbox(
    workspaceId: string,
    name: string,
    domain: string,
    ingestionMode: IngestionMode
  ): Promise<Mailbox> {
    const mailboxId = uuidv4()
    const emailAddress = `${name}@${domain}`

    const mailbox: Mailbox = {
      workspaceId,
      mailboxId,
      name,
      emailAddress,
      domain,
      createdAt: Date.now(),
      isActive: true,
      ingestionMode,
    }

    await dynamoDBService.put('tlao-email-mailboxes', mailbox)
    return mailbox
  }

  async deleteMailbox(workspaceId: string, mailboxId: string): Promise<void> {
    const mailbox = (await dynamoDBService.get('tlao-email-mailboxes', {
      workspaceId,
      mailboxId,
    })) as Mailbox

    if (!mailbox) {
      throw new Error('Mailbox not found')
    }

    await dynamoDBService.update(
      'tlao-email-mailboxes',
      { workspaceId, mailboxId },
      'SET isActive = :false',
      { ':false': false }
    )

    try {
      await this.stalwartClient.deletePrincipal(
        mailbox.stalwartPrincipalId || mailbox.stalwartPrincipalName || mailbox.emailAddress
      )
    } catch (error) {
      console.error('Failed to delete Stalwart principal:', error)
    }
  }

  async listMailboxes(workspaceId: string): Promise<Mailbox[]> {
    const result = await dynamoDBService.query(
      'tlao-email-mailboxes',
      'workspaceId = :workspaceId',
      { ':workspaceId': workspaceId }
    )

    return (result.items as Mailbox[]).filter((m) => m.isActive)
  }

  async resolveMailbox(emailAddress: string): Promise<Mailbox | null> {
    const result = await dynamoDBService.query(
      'tlao-email-mailboxes',
      'emailAddress = :emailAddress',
      { ':emailAddress': emailAddress },
      'EmailAddressIndex'
    )

    const mailboxes = result.items as Mailbox[]
    const mailbox = mailboxes.find((m) => m.isActive)
    return mailbox || null
  }

  async provisionMailbox(mailbox: Mailbox): Promise<ProvisioningResult> {
    try {
      const principalName = this.buildPrincipalName(mailbox)

      // Generate secure password
      const password = this.generateSecurePassword()

      // Create Stalwart principal
      const principal = await this.stalwartClient.createPrincipal({
        email: mailbox.emailAddress,
        name: principalName,
        password,
      })

      // Update mailbox with Stalwart principal ID
      await dynamoDBService.update(
        'tlao-email-mailboxes',
        { workspaceId: mailbox.workspaceId, mailboxId: mailbox.mailboxId },
        'SET stalwartPrincipalId = :principalId, stalwartPrincipalName = :principalName',
        { ':principalId': principal.id, ':principalName': principalName }
      )

      return {
        success: true,
        credentials: {
          emailAddress: mailbox.emailAddress,
          username: principalName,
          password,
          imapServer: this.stalwartHostname,
          imapPort: 993,
          imapSecurity: 'TLS',
          smtpServer: this.stalwartHostname,
          smtpPort: 587,
          smtpSecurity: 'STARTTLS',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Provisioning failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  private buildPrincipalName(mailbox: Mailbox): string {
    return mailbox.emailAddress.toLowerCase()
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}

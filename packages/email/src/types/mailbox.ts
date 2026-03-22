export type IngestionMode = 'operational' | 'opportunity' | 'personal'

export interface Mailbox {
  workspaceId: string
  mailboxId: string
  name: string
  emailAddress: string
  domain: string
  createdAt: number
  isActive: boolean
  ingestionMode: IngestionMode
  stalwartPrincipalId?: string
  stalwartPrincipalName?: string
  userId?: string
}

export interface ProvisioningResult {
  success: boolean
  credentials?: {
    emailAddress: string
    username: string
    password: string
    imapServer: string
    imapPort: number
    imapSecurity: 'STARTTLS' | 'TLS'
    smtpServer: string
    smtpPort: number
    smtpSecurity: 'STARTTLS' | 'TLS'
  }
  error?: string
}

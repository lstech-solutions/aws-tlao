export interface AttachmentMetadata {
  filename: string;
  contentType: string;
  size: number;
}

export interface ParsedEmail {
  fromAddress: string;
  toAddress: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: number;
  inReplyTo?: string;
  references?: string[];
  attachments: AttachmentMetadata[];
}

export type MailMessageStatus =
  | 'received'
  | 'processing'
  | 'processed'
  | 'needs_review'
  | 'parse_error'
  | 'processing_error'
  | 'queued';

export interface MailMessage {
  workspaceId: string;
  messageId: string;
  mailbox: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  bodyText: string;
  receivedAt: number;
  s3RawKey: string;
  threadId?: string;
  status: MailMessageStatus;
  classification?: string;
  classificationConfidence?: number;
  linkedRunId?: string;
  attachments: AttachmentMetadata[];
  ingestionMode: 'operational' | 'opportunity' | 'personal';
}

import { simpleParser, AddressObject } from 'mailparser'
import { v4 as uuidv4 } from 'uuid'
import * as AWS from 'aws-sdk'
import { MailMessage } from '../types/mail-message'
import { dynamoDBService } from '../lib/dynamodb'
import { s3Service } from '../lib/s3'
import { JMAPIngestionService } from '../services/jmap-ingestion'
import { IntakeProcessor } from '../services/intake-processor'
import { costTracker } from '../services/cost-tracker'

interface ParserEvent {
  emailId: string
  mailboxId: string
  workspaceId: string
}

const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION || 'us-east-1' })

const jmapService = new JMAPIngestionService(
  process.env.STALWART_URL || 'http://localhost:8080',
  process.env.STALWART_API_KEY || ''
)

const intakeProcessor = new IntakeProcessor(
  process.env.BACKEND_API_URL || 'http://localhost:3000',
  process.env.BACKEND_API_KEY || ''
)

function formatAddress(address?: AddressObject | AddressObject[]): string {
  if (!address) {
    return 'unknown'
  }

  if (Array.isArray(address)) {
    return (
      address
        .map((entry) => entry.text)
        .filter(Boolean)
        .join(', ') || 'unknown'
    )
  }

  return address.text || 'unknown'
}

function logToCloudWatch(
  logGroup: string,
  message: string,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const logMessage = {
    timestamp,
    message,
    context,
  }
  console.log(`[${logGroup}] ${JSON.stringify(logMessage)}`)
}

export async function handler(event: ParserEvent): Promise<void> {
  const { emailId, mailboxId, workspaceId } = event
  const messageId = uuidv4()

  try {
    logToCloudWatch('email-parser', 'Starting email parsing', {
      emailId,
      mailboxId,
      workspaceId,
      messageId,
    })

    // Fetch raw email from Stalwart
    const emailContent = await jmapService.getEmailContent(emailId)

    // Parse email
    const parsed = await simpleParser(emailContent.raw)

    // Extract threading headers
    const inReplyTo = (parsed.headers.get('in-reply-to') as string) || undefined
    const references = ((parsed.headers.get('references') as string) || '')
      .split(/\s+/)
      .filter((r) => r)

    // Resolve threadId
    let threadId = uuidv4()
    if (inReplyTo) {
      const existingMessages = await dynamoDBService.query(
        'tlao-email-messages',
        'workspaceId = :workspaceId',
        { ':workspaceId': workspaceId }
      )

      const referencedMessage = (existingMessages.items as MailMessage[]).find(
        (m) => m.messageId === inReplyTo
      )

      if (referencedMessage) {
        threadId = referencedMessage.threadId || referencedMessage.messageId
      }
    }

    // Store raw email in S3
    const s3Key = `raw/${workspaceId}/${messageId}`
    await s3Service.putObject(s3Key, emailContent.raw, 'message/rfc822')

    // Track S3 cost
    await costTracker.trackOperation({
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      service: 's3',
      operation: 'put_object',
      estimatedCostUsd: 0.000005,
      units: 1,
    })

    // Create MailMessage record
    const mailMessage: MailMessage = {
      workspaceId,
      messageId,
      mailbox: mailboxId,
      fromAddress: formatAddress(parsed.from),
      toAddress: formatAddress(parsed.to),
      subject: (parsed.subject as string) || '(no subject)',
      bodyText: (parsed.text as string) || '',
      receivedAt: Date.now(),
      s3RawKey: s3Key,
      threadId,
      status: 'received',
      attachments: (parsed.attachments || []).map((att) => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType || 'application/octet-stream',
        size: att.size || 0,
      })),
      ingestionMode: 'operational',
    }

    await dynamoDBService.put('tlao-email-messages', mailMessage)

    // Track DynamoDB cost
    await costTracker.trackOperation({
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      service: 'dynamodb',
      operation: 'put_item',
      estimatedCostUsd: 0.00000125,
      units: 1,
    })

    logToCloudWatch('email-parser', 'Email parsed successfully', {
      messageId,
      workspaceId,
      fromAddress: mailMessage.fromAddress,
      subject: mailMessage.subject,
    })

    // Mark as processed in Stalwart
    await jmapService.markAsProcessed(emailId)

    // Trigger intake processor
    logToCloudWatch('email-parser', 'Triggering intake processor', {
      messageId,
      workspaceId,
    })

    await intakeProcessor.processNewEmail(workspaceId, messageId)
  } catch (error) {
    const errorMessage = (error as Error).message

    logToCloudWatch('email-parser', 'Error parsing email', {
      emailId,
      mailboxId,
      workspaceId,
      messageId,
      error: errorMessage,
      stage: 'parsing',
    })

    // Create error record
    const mailMessage: MailMessage = {
      workspaceId,
      messageId,
      mailbox: mailboxId,
      fromAddress: 'unknown',
      toAddress: 'unknown',
      subject: '(parse error)',
      bodyText: '',
      receivedAt: Date.now(),
      s3RawKey: `raw/${workspaceId}/${messageId}`,
      status: 'parse_error',
      attachments: [],
      ingestionMode: 'operational',
    }

    try {
      await dynamoDBService.put('tlao-email-messages', mailMessage)
    } catch (dbError) {
      logToCloudWatch('email-parser', 'Failed to create error record', {
        messageId,
        workspaceId,
        error: (dbError as Error).message,
      })
    }

    throw error
  }
}

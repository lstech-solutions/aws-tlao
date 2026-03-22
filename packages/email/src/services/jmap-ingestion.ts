import fetch from 'node-fetch'
import * as AWS from 'aws-sdk'

const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' })

export interface EmailReference {
  emailId: string
  mailboxId: string
  receivedAt: number
}

export interface RawEmailContent {
  raw: string
  emailId: string
}

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

export class JMAPIngestionService {
  private stalwartUrl: string
  private apiKey: string
  private pollIntervalMs: number
  private retryConfig: RetryConfig
  private lambdaFunctionName: string

  constructor(
    stalwartUrl: string,
    apiKey: string,
    pollIntervalMs: number = 30000,
    lambdaFunctionName: string = 'email-parser'
  ) {
    this.stalwartUrl = stalwartUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.pollIntervalMs = pollIntervalMs
    this.lambdaFunctionName = lambdaFunctionName
    this.retryConfig = {
      maxRetries: 5,
      baseDelayMs: 100,
      maxDelayMs: 5000,
    }
  }

  private async exponentialBackoffRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (attempt < this.retryConfig.maxRetries) {
          const delayMs = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(2, attempt),
            this.retryConfig.maxDelayMs
          )
          console.warn(
            `[${context}] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`
          )
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }

    throw new Error(
      `${context} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
    )
  }

  private logToCloudWatch(
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

  async connect(): Promise<void> {
    try {
      await this.exponentialBackoffRetry(async () => {
        const response = await fetch(`${this.stalwartUrl}/.well-known/jmap`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        })

        if (!response.ok) {
          throw new Error(`JMAP connection failed: ${response.status}`)
        }
      }, 'JMAP connection')

      this.logToCloudWatch('jmap-ingestion', 'JMAP connection established')
    } catch (error) {
      this.logToCloudWatch('jmap-ingestion', 'JMAP connection failed', {
        error: (error as Error).message,
      })
      throw error
    }
  }

  async pollForNewEmails(mailboxId: string, workspaceId: string): Promise<EmailReference[]> {
    try {
      const emailReferences = await this.exponentialBackoffRetry(async () => {
        const response = await fetch(`${this.stalwartUrl}/jmap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
            methodCalls: [
              [
                'Email/query',
                {
                  accountId: 'default',
                  filter: {
                    inMailbox: mailboxId,
                    hasKeyword: 'unprocessed',
                  },
                },
                'ref0',
              ],
            ],
          }),
        })

        if (!response.ok) {
          throw new Error(`JMAP query failed: ${response.status}`)
        }

        const data = (await response.json()) as any
        const emailIds = data.methodResponses?.[0]?.[1]?.ids || []

        return emailIds.map((emailId: string) => ({
          emailId,
          mailboxId,
          receivedAt: Date.now(),
        }))
      }, 'JMAP poll')

      this.logToCloudWatch('jmap-ingestion', 'Polled for new emails', {
        mailboxId,
        workspaceId,
        emailCount: emailReferences.length,
      })

      // Trigger Lambda for each email
      for (const emailRef of emailReferences) {
        await this.triggerEmailParserLambda(emailRef, workspaceId)
      }

      return emailReferences
    } catch (error) {
      this.logToCloudWatch('jmap-ingestion', 'Error polling for new emails', {
        mailboxId,
        workspaceId,
        error: (error as Error).message,
      })
      return []
    }
  }

  private async triggerEmailParserLambda(
    emailRef: EmailReference,
    workspaceId: string
  ): Promise<void> {
    try {
      const payload = {
        emailId: emailRef.emailId,
        mailboxId: emailRef.mailboxId,
        workspaceId,
      }

      await lambda
        .invoke({
          FunctionName: this.lambdaFunctionName,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify(payload),
        })
        .promise()

      this.logToCloudWatch('jmap-ingestion', 'Triggered Email Parser Lambda', {
        emailId: emailRef.emailId,
        mailboxId: emailRef.mailboxId,
        workspaceId,
      })
    } catch (error) {
      this.logToCloudWatch('jmap-ingestion', 'Failed to trigger Email Parser Lambda', {
        emailId: emailRef.emailId,
        mailboxId: emailRef.mailboxId,
        workspaceId,
        error: (error as Error).message,
      })
      throw error
    }
  }

  async getEmailContent(emailId: string): Promise<RawEmailContent> {
    try {
      const content = await this.exponentialBackoffRetry(async () => {
        const response = await fetch(`${this.stalwartUrl}/jmap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
            methodCalls: [
              [
                'Email/get',
                {
                  accountId: 'default',
                  ids: [emailId],
                  properties: ['bodyRaw'],
                },
                'ref0',
              ],
            ],
          }),
        })

        if (!response.ok) {
          throw new Error(`JMAP get failed: ${response.status}`)
        }

        const data = (await response.json()) as any
        const email = data.methodResponses?.[0]?.[1]?.list?.[0]

        if (!email) {
          throw new Error('Email not found')
        }

        return {
          raw: email.bodyRaw || '',
          emailId,
        }
      }, 'JMAP get email content')

      return content
    } catch (error) {
      this.logToCloudWatch('jmap-ingestion', 'Failed to get email content', {
        emailId,
        error: (error as Error).message,
      })
      throw error
    }
  }

  async markAsProcessed(emailId: string): Promise<void> {
    try {
      await this.exponentialBackoffRetry(async () => {
        await fetch(`${this.stalwartUrl}/jmap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
            methodCalls: [
              [
                'Email/set',
                {
                  accountId: 'default',
                  update: {
                    [emailId]: {
                      keywords: { processed: true },
                    },
                  },
                },
                'ref0',
              ],
            ],
          }),
        })
      }, 'JMAP mark as processed')

      this.logToCloudWatch('jmap-ingestion', 'Marked email as processed', { emailId })
    } catch (error) {
      this.logToCloudWatch('jmap-ingestion', 'Failed to mark email as processed', {
        emailId,
        error: (error as Error).message,
      })
    }
  }
}

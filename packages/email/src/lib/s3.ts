import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export class S3Service {
  private bucketName: string;
  private retryConfig: RetryConfig;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 5000,
    };
  }

  private async exponentialBackoffRetry<T>(
    fn: () => Promise<T>,
    context: string
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
          console.warn(
            `[S3Service] ${context} attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  async putObject(key: string, body: string | Buffer, contentType?: string): Promise<void> {
    await this.exponentialBackoffRetry(async () => {
      const params: any = {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
      };

      if (contentType) {
        params.ContentType = contentType;
      }

      await s3.putObject(params).promise();
    }, `S3 putObject ${key}`);
  }

  async getObject(key: string): Promise<string> {
    return this.exponentialBackoffRetry(async () => {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await s3.getObject(params).promise();
      return result.Body?.toString() || '';
    }, `S3 getObject ${key}`);
  }

  async deleteObject(key: string): Promise<void> {
    await this.exponentialBackoffRetry(async () => {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      await s3.deleteObject(params).promise();
    }, `S3 deleteObject ${key}`);
  }
}

export const s3Service = new S3Service(process.env.EMAIL_BUCKET || 'tlao-email');

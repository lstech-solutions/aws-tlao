/**
 * S3 service wrapper for document storage and retrieval
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

/**
 * S3 upload parameters
 */
export interface S3UploadParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * S3 download result
 */
export interface S3DownloadResult {
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  lastModified?: Date;
  contentLength?: number;
}

/**
 * S3 object metadata
 */
export interface S3ObjectMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * S3 service class with encryption and error handling
 */
export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({ region: config.s3.region });
    this.bucketName = config.s3.bucketName;
  }

  /**
   * Upload a file to S3 with encryption
   */
  async upload(params: S3UploadParams): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata,
        ServerSideEncryption: 'AES256', // Enable server-side encryption
      });

      await this.client.send(command);
      
      logger.debug('File uploaded successfully', {
        bucket: this.bucketName,
        key: params.key,
        contentType: params.contentType,
      });
    } catch (error) {
      logger.error('Failed to upload file to S3', {
        bucket: this.bucketName,
        key: params.key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Download a file from S3
   */
  async download(key: string): Promise<S3DownloadResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      // Convert stream to buffer
      const body = await this.streamToBuffer(response.Body as any);

      logger.debug('File downloaded successfully', {
        bucket: this.bucketName,
        key,
        size: body.length,
      });

      return {
        body,
        contentType: response.ContentType,
        metadata: response.Metadata,
        lastModified: response.LastModified,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      logger.error('Failed to download file from S3', {
        bucket: this.bucketName,
        key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  }

  /**
   * Get file metadata without downloading content
   */
  async getMetadata(key: string): Promise<S3ObjectMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      logger.debug('File metadata retrieved', {
        bucket: this.bucketName,
        key,
        size: response.ContentLength,
      });

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      logger.error('Failed to get file metadata from S3', {
        bucket: this.bucketName,
        key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get file metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch (error) {
      if ((error as any).name === 'NotFound' || (error as any).$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      
      logger.debug('File deleted successfully', {
        bucket: this.bucketName,
        key,
      });
    } catch (error) {
      logger.error('Failed to delete file from S3', {
        bucket: this.bucketName,
        key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  /**
   * List files with a prefix
   */
  async listFiles(prefix: string, maxKeys: number = 100): Promise<S3ObjectMetadata[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);
      
      const files: S3ObjectMetadata[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));

      logger.debug('Files listed successfully', {
        bucket: this.bucketName,
        prefix,
        count: files.length,
      });

      return files;
    } catch (error) {
      logger.error('Failed to list files from S3', {
        bucket: this.bucketName,
        prefix,
        error: (error as Error).message,
      });
      throw new Error(`Failed to list files: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a presigned URL for file upload
   */
  async generateUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ServerSideEncryption: 'AES256',
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      
      logger.debug('Upload URL generated', {
        bucket: this.bucketName,
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate upload URL', {
        bucket: this.bucketName,
        key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to generate upload URL: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a presigned URL for file download
   */
  async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      
      logger.debug('Download URL generated', {
        bucket: this.bucketName,
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate download URL', {
        bucket: this.bucketName,
        key,
        error: (error as Error).message,
      });
      throw new Error(`Failed to generate download URL: ${(error as Error).message}`);
    }
  }

  /**
   * Generate S3 key for document storage
   */
  static generateDocumentKey(userId: string, documentId: string, fileName: string): string {
    // Clean filename to remove special characters
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `documents/${userId}/${documentId}/${cleanFileName}`;
  }

  /**
   * Generate S3 key for transcript storage
   */
  static generateTranscriptKey(userId: string, documentId: string): string {
    return `documents/${userId}/${documentId}/transcript.txt`;
  }

  /**
   * Generate S3 key for result storage
   */
  static generateResultKey(userId: string, resultId: string): string {
    return `results/${userId}/${resultId}.json`;
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Validate S3 key format
   */
  static validateKey(key: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!key || key.trim().length === 0) {
      errors.push('Key cannot be empty');
    }

    if (key.length > 1024) {
      errors.push('Key cannot exceed 1024 characters');
    }

    if (key.includes('//')) {
      errors.push('Key cannot contain consecutive slashes');
    }

    if (key.startsWith('/') || key.endsWith('/')) {
      errors.push('Key cannot start or end with slash');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const s3Service = new S3Service();
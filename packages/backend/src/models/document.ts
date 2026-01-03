/**
 * Document model with metadata storage and retrieval
 */

import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb';
import { s3Service, S3Service } from '../services/s3';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { DocumentMetadata, DocumentType, ProcessedDocument } from './types';

/**
 * Document creation parameters
 */
export interface CreateDocumentParams {
  userId: string;
  fileName: string;
  fileSize: number;
  documentType: DocumentType;
  textContent: string;
  fileBuffer: Buffer;
  metadata?: {
    source?: string;
    sender?: string;
    subject?: string;
  };
}

/**
 * Document query parameters
 */
export interface DocumentQueryParams {
  userId: string;
  documentType?: DocumentType;
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

/**
 * Document model class with DynamoDB and S3 operations
 */
export class DocumentModel {
  /**
   * Create a new document with file storage
   */
  static async create(params: CreateDocumentParams): Promise<DocumentMetadata> {
    const documentId = uuidv4();
    const now = Date.now();

    // Generate S3 key for document storage
    const s3Key = S3Service.generateDocumentKey(params.userId, documentId, params.fileName);

    try {
      // Upload file to S3
      await s3Service.upload({
        key: s3Key,
        body: params.fileBuffer,
        contentType: this.getContentType(params.documentType, params.fileName),
        metadata: {
          userId: params.userId,
          documentId,
          originalFileName: params.fileName,
          documentType: params.documentType,
        },
      });

      // Create document metadata
      const document: DocumentMetadata = {
        userId: params.userId,
        documentId,
        uploadTime: now,
        documentType: params.documentType,
        fileName: params.fileName,
        fileSize: params.fileSize,
        s3Path: s3Key,
        textContent: params.textContent.substring(0, 5000), // Store first 5000 chars for indexing
        metadata: params.metadata,
      };

      // Store metadata in DynamoDB
      await dynamoDBService.put(config.dynamodb.documentsTable, document);

      logger.info('Document created successfully', {
        documentId,
        userId: params.userId,
        fileName: params.fileName,
        documentType: params.documentType,
      });

      return document;
    } catch (error) {
      logger.error('Failed to create document', {
        userId: params.userId,
        fileName: params.fileName,
        error: (error as Error).message,
      });
      throw new Error(`Failed to create document: ${(error as Error).message}`);
    }
  }

  /**
   * Get document by ID
   */
  static async getById(userId: string, documentId: string): Promise<DocumentMetadata | null> {
    try {
      const document = await dynamoDBService.get<DocumentMetadata>(
        config.dynamodb.documentsTable,
        { userId, documentId }
      );

      if (document) {
        logger.debug('Document retrieved by ID', { userId, documentId });
      } else {
        logger.debug('Document not found by ID', { userId, documentId });
      }

      return document;
    } catch (error) {
      logger.error('Failed to get document by ID', {
        userId,
        documentId,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get document: ${(error as Error).message}`);
    }
  }

  /**
   * Get documents for a user
   */
  static async getByUserId(params: DocumentQueryParams): Promise<{
    documents: DocumentMetadata[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    try {
      let queryParams: any = {
        tableName: config.dynamodb.documentsTable,
        keyConditionExpression: 'userId = :userId',
        expressionAttributeValues: {
          ':userId': params.userId,
        },
        limit: params.limit || 50,
        exclusiveStartKey: params.lastEvaluatedKey,
      };

      // Add filter for document type if specified
      if (params.documentType) {
        queryParams.filterExpression = 'documentType = :documentType';
        queryParams.expressionAttributeValues[':documentType'] = params.documentType;
      }

      const result = await dynamoDBService.query<DocumentMetadata>(queryParams);

      logger.debug('Documents retrieved for user', {
        userId: params.userId,
        count: result.items.length,
        documentType: params.documentType,
      });

      return {
        documents: result.items,
        lastEvaluatedKey: result.lastEvaluatedKey,
      };
    } catch (error) {
      logger.error('Failed to get documents by user ID', {
        userId: params.userId,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get documents: ${(error as Error).message}`);
    }
  }

  /**
   * Get documents by upload time range
   */
  static async getByUploadTime(
    userId: string,
    startTime: number,
    endTime: number,
    limit?: number
  ): Promise<DocumentMetadata[]> {
    try {
      const result = await dynamoDBService.query<DocumentMetadata>({
        tableName: config.dynamodb.documentsTable,
        indexName: 'UploadTimeIndex',
        keyConditionExpression: 'userId = :userId AND uploadTime BETWEEN :startTime AND :endTime',
        expressionAttributeValues: {
          ':userId': userId,
          ':startTime': startTime,
          ':endTime': endTime,
        },
        limit: limit || 100,
      });

      logger.debug('Documents retrieved by upload time', {
        userId,
        startTime,
        endTime,
        count: result.items.length,
      });

      return result.items;
    } catch (error) {
      logger.error('Failed to get documents by upload time', {
        userId,
        startTime,
        endTime,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get documents by upload time: ${(error as Error).message}`);
    }
  }

  /**
   * Get full document content from S3
   */
  static async getContent(userId: string, documentId: string): Promise<ProcessedDocument | null> {
    try {
      // Get document metadata
      const document = await this.getById(userId, documentId);
      if (!document) {
        return null;
      }

      // Download content from S3
      const s3Result = await s3Service.download(document.s3Path);
      const textContent = s3Result.body.toString('utf-8');

      logger.debug('Document content retrieved', {
        userId,
        documentId,
        contentLength: textContent.length,
      });

      return {
        documentId,
        documentType: document.documentType,
        textContent,
        metadata: document.metadata,
      };
    } catch (error) {
      logger.error('Failed to get document content', {
        userId,
        documentId,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get document content: ${(error as Error).message}`);
    }
  }

  /**
   * Update document transcript (for audio files)
   */
  static async updateTranscript(
    userId: string,
    documentId: string,
    transcript: string
  ): Promise<void> {
    try {
      // Generate S3 key for transcript
      const transcriptKey = S3Service.generateTranscriptKey(userId, documentId);

      // Upload transcript to S3
      await s3Service.upload({
        key: transcriptKey,
        body: transcript,
        contentType: 'text/plain',
        metadata: {
          userId,
          documentId,
          type: 'transcript',
        },
      });

      // Update document metadata with transcript path
      await dynamoDBService.update({
        tableName: config.dynamodb.documentsTable,
        key: { userId, documentId },
        updateExpression: 'SET transcriptPath = :transcriptPath, textContent = :textContent',
        expressionAttributeValues: {
          ':transcriptPath': transcriptKey,
          ':textContent': transcript.substring(0, 5000), // Update indexed text content
        },
      });

      logger.info('Document transcript updated', { userId, documentId });
    } catch (error) {
      logger.error('Failed to update document transcript', {
        userId,
        documentId,
        error: (error as Error).message,
      });
      throw new Error(`Failed to update transcript: ${(error as Error).message}`);
    }
  }

  /**
   * Delete document and its files
   */
  static async delete(userId: string, documentId: string): Promise<void> {
    try {
      // Get document metadata first
      const document = await this.getById(userId, documentId);
      if (!document) {
        logger.warn('Document not found for deletion', { userId, documentId });
        return;
      }

      // Delete files from S3
      await s3Service.delete(document.s3Path);
      
      if (document.transcriptPath) {
        await s3Service.delete(document.transcriptPath);
      }

      // Delete metadata from DynamoDB
      await dynamoDBService.delete(config.dynamodb.documentsTable, { userId, documentId });

      logger.info('Document deleted successfully', { userId, documentId });
    } catch (error) {
      logger.error('Failed to delete document', {
        userId,
        documentId,
        error: (error as Error).message,
      });
      throw new Error(`Failed to delete document: ${(error as Error).message}`);
    }
  }

  /**
   * Get multiple documents by IDs
   */
  static async getMultiple(userId: string, documentIds: string[]): Promise<ProcessedDocument[]> {
    try {
      const documents: ProcessedDocument[] = [];

      for (const documentId of documentIds) {
        const document = await this.getContent(userId, documentId);
        if (document) {
          documents.push(document);
        }
      }

      logger.debug('Multiple documents retrieved', {
        userId,
        requestedCount: documentIds.length,
        retrievedCount: documents.length,
      });

      return documents;
    } catch (error) {
      logger.error('Failed to get multiple documents', {
        userId,
        documentIds,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get multiple documents: ${(error as Error).message}`);
    }
  }

  /**
   * Get content type based on document type and filename
   */
  private static getContentType(documentType: DocumentType, fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (documentType) {
      case 'pdf':
        return 'application/pdf';
      case 'email':
        return 'message/rfc822';
      case 'audio':
        if (extension === 'mp3') return 'audio/mpeg';
        if (extension === 'wav') return 'audio/wav';
        return 'audio/mpeg';
      case 'text':
        return 'text/plain';
      case 'markdown':
        return 'text/markdown';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Validate document data
   */
  static validate(document: Partial<DocumentMetadata>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!document.userId) {
      errors.push('User ID is required');
    }

    if (!document.fileName || document.fileName.trim().length === 0) {
      errors.push('File name is required');
    }

    if (!document.documentType) {
      errors.push('Document type is required');
    }

    if (!['email', 'pdf', 'audio', 'text', 'markdown'].includes(document.documentType || '')) {
      errors.push('Invalid document type');
    }

    if (document.fileSize !== undefined && document.fileSize <= 0) {
      errors.push('File size must be greater than 0');
    }

    if (document.fileSize !== undefined && document.fileSize > 50 * 1024 * 1024) {
      errors.push('File size cannot exceed 50MB');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
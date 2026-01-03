/**
 * Document parsing service for various file formats
 */

import { DocumentType } from '../models/types';
import { logger } from '../utils/logger';

/**
 * Parsed document result
 */
export interface ParsedDocument {
  textContent: string;
  metadata?: {
    source?: string;
    sender?: string;
    subject?: string;
    [key: string]: any;
  };
}

/**
 * Document validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  documentType?: DocumentType;
}

/**
 * Document parser service
 */
export class DocumentParserService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'message/rfc822': 'email',
    'text/plain': 'text',
    'text/markdown': 'markdown',
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'audio/mp3': 'audio',
  };

  /**
   * Validate uploaded file
   */
  static validateFile(
    buffer: Buffer,
    fileName: string,
    mimeType?: string
  ): ValidationResult {
    const errors: string[] = [];

    // Check file size
    if (buffer.length > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (buffer.length === 0) {
      errors.push('File is empty');
    }

    // Determine document type from file extension and MIME type
    const documentType = this.determineDocumentType(fileName, mimeType);
    if (!documentType) {
      errors.push('Unsupported file format');
    }

    // Validate file extension matches content
    if (documentType && !this.validateFileExtension(fileName, documentType)) {
      errors.push('File extension does not match content type');
    }

    return {
      valid: errors.length === 0,
      errors,
      documentType,
    };
  }

  /**
   * Parse document based on type
   */
  static async parseDocument(
    buffer: Buffer,
    fileName: string,
    documentType: DocumentType
  ): Promise<ParsedDocument> {
    try {
      logger.debug('Parsing document', { fileName, documentType, size: buffer.length });

      switch (documentType) {
        case 'email':
          return await this.parseEmail(buffer);
        case 'pdf':
          return await this.parsePDF(buffer);
        case 'text':
          return this.parseText(buffer);
        case 'markdown':
          return this.parseMarkdown(buffer);
        case 'audio':
          return this.parseAudio(buffer, fileName);
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }
    } catch (error) {
      logger.error('Failed to parse document', {
        fileName,
        documentType,
        error: (error as Error).message,
      });
      throw new Error(`Failed to parse document: ${(error as Error).message}`);
    }
  }

  /**
   * Parse email file (.eml format)
   */
  private static async parseEmail(buffer: Buffer): Promise<ParsedDocument> {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n');
    
    let headers: Record<string, string> = {};
    let bodyStartIndex = 0;
    let inHeaders = true;

    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (inHeaders) {
        if (line === '') {
          bodyStartIndex = i + 1;
          inHeaders = false;
          break;
        }
        
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
    }

    // Extract body
    const body = lines.slice(bodyStartIndex).join('\n').trim();
    
    // Combine headers and body for full text content
    const textContent = `Subject: ${headers.subject || 'No Subject'}\n` +
                       `From: ${headers.from || 'Unknown'}\n` +
                       `Date: ${headers.date || 'Unknown'}\n\n` +
                       body;

    return {
      textContent,
      metadata: {
        source: 'email',
        sender: headers.from,
        subject: headers.subject,
        date: headers.date,
        to: headers.to,
        cc: headers.cc,
      },
    };
  }

  /**
   * Parse PDF file (simplified - would use pdf-parse in real implementation)
   */
  private static async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    // For now, return a placeholder. In a real implementation, you would use:
    // const pdf = require('pdf-parse');
    // const data = await pdf(buffer);
    // return { textContent: data.text };
    
    logger.warn('PDF parsing not fully implemented - using placeholder');
    
    return {
      textContent: '[PDF content would be extracted here using pdf-parse library]',
      metadata: {
        source: 'pdf',
        pages: 1, // Would be extracted from actual PDF
      },
    };
  }

  /**
   * Parse plain text file
   */
  private static parseText(buffer: Buffer): ParsedDocument {
    const textContent = buffer.toString('utf-8');
    
    return {
      textContent,
      metadata: {
        source: 'text',
        encoding: 'utf-8',
      },
    };
  }

  /**
   * Parse markdown file
   */
  private static parseMarkdown(buffer: Buffer): ParsedDocument {
    const textContent = buffer.toString('utf-8');
    
    // Extract title from first # heading if present
    const lines = textContent.split('\n');
    const titleLine = lines.find(line => line.startsWith('# '));
    const title = titleLine ? titleLine.substring(2).trim() : undefined;
    
    return {
      textContent,
      metadata: {
        source: 'markdown',
        title,
        encoding: 'utf-8',
      },
    };
  }

  /**
   * Parse audio file (placeholder for transcription)
   */
  private static parseAudio(buffer: Buffer, fileName: string): ParsedDocument {
    // Audio files need to be transcribed using Amazon Transcribe
    // This returns a placeholder that will be updated after transcription
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    return {
      textContent: '[Audio transcription pending]',
      metadata: {
        source: 'audio',
        fileName,
        format: extension,
        size: buffer.length,
        needsTranscription: true,
      },
    };
  }

  /**
   * Determine document type from filename and MIME type
   */
  private static determineDocumentType(fileName: string, mimeType?: string): DocumentType | null {
    // First try MIME type
    if (mimeType && this.SUPPORTED_MIME_TYPES[mimeType as keyof typeof this.SUPPORTED_MIME_TYPES]) {
      return this.SUPPORTED_MIME_TYPES[mimeType as keyof typeof this.SUPPORTED_MIME_TYPES] as DocumentType;
    }

    // Fall back to file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'eml':
      case 'msg':
        return 'email';
      case 'txt':
        return 'text';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'mp3':
      case 'wav':
      case 'm4a':
        return 'audio';
      default:
        return null;
    }
  }

  /**
   * Validate file extension matches document type
   */
  private static validateFileExtension(fileName: string, documentType: DocumentType): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (documentType) {
      case 'pdf':
        return extension === 'pdf';
      case 'email':
        return ['eml', 'msg'].includes(extension || '');
      case 'text':
        return extension === 'txt';
      case 'markdown':
        return ['md', 'markdown'].includes(extension || '');
      case 'audio':
        return ['mp3', 'wav', 'm4a'].includes(extension || '');
      default:
        return false;
    }
  }

  /**
   * Extract text preview (first N characters)
   */
  static extractPreview(textContent: string, maxLength: number = 500): string {
    if (textContent.length <= maxLength) {
      return textContent;
    }
    
    return textContent.substring(0, maxLength) + '...';
  }

  /**
   * Clean and normalize text content
   */
  static cleanTextContent(textContent: string): string {
    return textContent
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
      .trim();
  }

  /**
   * Detect text encoding (simplified)
   */
  static detectEncoding(buffer: Buffer): string {
    // Simple UTF-8 detection - in production, use a proper encoding detection library
    try {
      buffer.toString('utf-8');
      return 'utf-8';
    } catch {
      return 'latin1'; // Fallback
    }
  }
}
/**
 * Document Ingestion Lambda handler
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DocumentParserService } from '../services/document-parser';
import { transcribeService } from '../services/transcribe';
import { DocumentModel } from '../models/document';
import { SessionModel } from '../models/session';
import { logger } from '../utils/logger';
import { ApiResponse, ErrorResponse } from '../models/types';

/**
 * Document upload request body
 */
interface DocumentUploadRequest {
  fileName: string;
  fileContent: string; // Base64 encoded file content
  mimeType?: string;
  userId?: string; // Optional if extracted from session
}

/**
 * Document upload response
 */
interface DocumentUploadResponse {
  documentId: string;
  status: 'processed' | 'transcribing';
  textLength: number;
  s3Path: string;
  transcriptionJobId?: string;
}

/**
 * Lambda handler for document ingestion
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const startTime = Date.now();

  logger.info('Document ingestion request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    // Authenticate request
    const session = await authenticateRequest(event);
    if (!session) {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Invalid or missing authentication');
    }

    // Parse request body
    const request = parseRequestBody(event.body);
    const userId = request.userId || session.userId;

    // Validate request
    const validationResult = validateUploadRequest(request);
    if (!validationResult.valid) {
      return createErrorResponse(400, 'VALIDATION_ERROR', validationResult.errors.join(', '));
    }

    // Decode file content
    const fileBuffer = Buffer.from(request.fileContent, 'base64');

    // Validate file
    const fileValidation = DocumentParserService.validateFile(
      fileBuffer,
      request.fileName,
      request.mimeType
    );

    if (!fileValidation.valid) {
      return createErrorResponse(400, 'INVALID_FILE', fileValidation.errors.join(', '));
    }

    const documentType = fileValidation.documentType!;

    // Parse document
    const parsedDocument = await DocumentParserService.parseDocument(
      fileBuffer,
      request.fileName,
      documentType
    );

    // Create document record
    const document = await DocumentModel.create({
      userId,
      fileName: request.fileName,
      fileSize: fileBuffer.length,
      documentType,
      textContent: DocumentParserService.cleanTextContent(parsedDocument.textContent),
      fileBuffer,
      metadata: parsedDocument.metadata,
    });

    let response: DocumentUploadResponse = {
      documentId: document.documentId,
      status: 'processed',
      textLength: parsedDocument.textContent.length,
      s3Path: document.s3Path,
    };

    // Handle audio transcription asynchronously
    if (documentType === 'audio' && parsedDocument.metadata?.needsTranscription) {
      try {
        // Start transcription (this will run asynchronously)
        const transcript = await transcribeService.transcribeAudio(
          userId,
          document.documentId,
          document.s3Path
        );

        // Update document with transcript
        await DocumentModel.updateTranscript(userId, document.documentId, transcript);

        response.status = 'processed';
        response.textLength = transcript.length;
      } catch (transcriptionError) {
        logger.error('Transcription failed, but document was saved', {
          documentId: document.documentId,
          error: (transcriptionError as Error).message,
        });
        
        response.status = 'processed'; // Document is still saved, just without transcription
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Document ingestion completed', {
      requestId,
      documentId: document.documentId,
      userId,
      documentType,
      processingTime,
    });

    return createSuccessResponse({
      success: true,
      data: response,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Document ingestion failed', {
      requestId,
      error: (error as Error).message,
      processingTime,
    });

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
};

/**
 * Authenticate request using API key
 */
async function authenticateRequest(event: APIGatewayProxyEvent) {
  try {
    const apiKey = event.headers['X-API-Key'] || event.headers['x-api-key'];
    
    if (!apiKey) {
      logger.debug('No API key provided in request');
      return null;
    }

    const session = await SessionModel.validateApiKey(apiKey);
    
    if (!session) {
      logger.debug('Invalid API key provided');
      return null;
    }

    return session;
  } catch (error) {
    logger.error('Authentication error', { error: (error as Error).message });
    return null;
  }
}

/**
 * Parse request body
 */
function parseRequestBody(body: string | null): DocumentUploadRequest {
  if (!body) {
    throw new Error('Request body is required');
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate upload request
 */
function validateUploadRequest(request: DocumentUploadRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.fileName || request.fileName.trim().length === 0) {
    errors.push('fileName is required');
  }

  if (!request.fileContent || request.fileContent.trim().length === 0) {
    errors.push('fileContent is required');
  }

  // Validate base64 encoding
  if (request.fileContent) {
    try {
      Buffer.from(request.fileContent, 'base64');
    } catch (error) {
      errors.push('fileContent must be valid base64 encoded data');
    }
  }

  // Validate filename
  if (request.fileName && request.fileName.length > 255) {
    errors.push('fileName cannot exceed 255 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create success response
 */
function createSuccessResponse(data: ApiResponse): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, code: string, message: string): APIGatewayProxyResult {
  const errorResponse: ErrorResponse = {
    error: message,
    code,
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    },
    body: JSON.stringify(errorResponse),
  };
}

/**
 * Handle OPTIONS requests for CORS
 */
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    },
    body: '',
  };
};
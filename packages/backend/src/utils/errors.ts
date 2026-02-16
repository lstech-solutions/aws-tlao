/**
 * Error handling utilities for the AI Agent Platform
 */

import { logger } from './logger';

/**
 * Error types for the application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  SERVICE = 'SERVICE',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  STORAGE_LIMIT = 'STORAGE_LIMIT',
  TOKEN_LIMIT = 'TOKEN_LIMIT',
  INTERNAL = 'INTERNAL',
}

/**
 * Application error class
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly statusCode: number;
  readonly details?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.VALIDATION, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.AUTH, 401, details);
    this.name = 'AuthError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.AUTH, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Service error
 */
export class ServiceError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.SERVICE, 500, details);
    this.name = 'ServiceError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    super(message, ErrorType.RATE_LIMIT, 429, details);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

/**
 * Storage limit error
 */
export class StorageLimitError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.STORAGE_LIMIT, 413, details);
    this.name = 'StorageLimitError';
  }
}

/**
 * Token limit error
 */
export class TokenLimitError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.TOKEN_LIMIT, 429, details);
    this.name = 'TokenLimitError';
  }
}

/**
 * Internal error
 */
export class InternalError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.INTERNAL, 500, details);
    this.name = 'InternalError';
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
  type?: string;
}

/**
 * Format error for response
 */
export function formatErrorResponse(error: Error): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.type,
      details: error.details,
      type: error.name,
    };
  }

  // Log unexpected errors
  logger.error('Unexpected error', {
    message: error.message,
    stack: error.stack,
  });

  return {
    error: 'Internal server error',
    code: ErrorType.INTERNAL,
  };
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.VALIDATION:
        logger.warn('Validation error', { message: error.message, ...context });
        break;
      case ErrorType.AUTH:
        logger.warn('Authentication error', { message: error.message, ...context });
        break;
      case ErrorType.SERVICE:
        logger.error('Service error', { message: error.message, ...context });
        break;
      case ErrorType.NOT_FOUND:
        logger.info('Not found', { message: error.message, ...context });
        break;
      case ErrorType.RATE_LIMIT:
        logger.warn('Rate limit exceeded', { message: error.message, ...context });
        break;
      case ErrorType.STORAGE_LIMIT:
        logger.warn('Storage limit exceeded', { message: error.message, ...context });
        break;
      case ErrorType.TOKEN_LIMIT:
        logger.warn('Token limit exceeded', { message: error.message, ...context });
        break;
      default:
        logger.error('Error', { message: error.message, ...context });
    }
  } else {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt);

      logger.warn(`Operation failed, retrying in ${delayMs}ms`, {
        attempt: attempt + 1,
        maxRetries: maxRetries,
        error: (error as Error).message,
      });

      await sleep(delayMs);
    }
  }

  logger.error('Operation failed after all retries', {
    maxRetries,
    error: lastError?.message,
  });

  throw lastError;
}

/**
 * Check if error should not be retried
 */
export function isNonRetryableError(error: any): boolean {
  const nonRetryableErrors = [
    'ValidationException',
    'AccessDeniedException',
    'ResourceNotFoundException',
    'ConditionalCheckFailedException',
  ];

  return nonRetryableErrors.includes(error.name) ||
    (error.$metadata?.httpStatusCode >= 400 && error.$metadata?.httpStatusCode < 500);
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return result;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    throw error;
  }
}

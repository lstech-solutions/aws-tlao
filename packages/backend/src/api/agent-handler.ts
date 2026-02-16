/**
 * Agent handler Lambda for processing agent invocations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { agentOrchestratorService } from '../services/agent-orchestrator';
import { rateLimiterService } from '../services/rate-limiter';
import { tokenTrackerService } from '../services/token-tracker';
import { storageTrackerService } from '../services/storage-tracker';
import { StorageTrackerService } from '../services/storage-tracker';
import { dailyUsageService } from '../services/daily-usage';
import { SessionModel } from '../models/session';
import { logger } from '../utils/logger';
import { ApiResponse, ErrorResponse } from '../models/types';
import { AppError, ErrorType, logError } from '../utils/errors';

/**
 * Agent invocation request body
 */
interface AgentInvocationRequest {
  agentType: 'tlao-plan' | 'tlao-grant';
  documentIds?: string[];
  organizationProfile?: any;
  language?: string;
}

/**
 * Agent invocation response
 */

/**
 * Lambda handler for agent invocation
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const startTime = Date.now();

  logger.info('Agent invocation request received', {
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
    const userId = session.userId;

    // Validate request
    const validationResult = validateInvocationRequest(request);
    if (!validationResult.valid) {
      return createErrorResponse(400, 'VALIDATION_ERROR', validationResult.errors.join(', '));
    }

    // Check Free Tier limits
    const freeTierCheck = await checkFreeTierLimits(userId);
    if (!freeTierCheck.allowed) {
      return createErrorResponse(429, 'FREE_TIER_LIMIT', freeTierCheck.message);
    }

    // Execute agent
    const result = await agentOrchestratorService.executeAgent({
      userId,
      agentType: request.agentType,
      documentIds: request.documentIds,
      organizationProfile: request.organizationProfile,
      language: request.language,
    });

    const processingTime = Date.now() - startTime;

    logger.info('Agent invocation completed', {
      requestId,
      resultId: result.resultId,
      agentType: result.agentType,
      processingTime,
    });

    return createSuccessResponse({
      success: true,
      data: {
        resultId: result.resultId,
        agentType: result.agentType,
        output: result.output,
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const appError = error as AppError;

    logError(appError, {
      requestId,
      processingTime,
    });

    return createErrorResponse(
      appError.statusCode,
      appError.type,
      appError.message,
      appError.details
    );
  }
};

/**
 * Get agent result by ID
 */
export const getResultHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const startTime = Date.now();

  logger.info('Agent result request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Validate HTTP method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    // Authenticate request
    const session = await authenticateRequest(event);
    if (!session) {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Invalid or missing authentication');
    }

    // Get result ID from path parameter
    const resultId = event.pathParameters?.resultId;
    if (!resultId) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'resultId is required');
    }

    // Get result
    const result = await agentOrchestratorService.getResult(resultId, session.userId);

    const processingTime = Date.now() - startTime;

    logger.info('Agent result retrieved', {
      requestId,
      resultId,
      processingTime,
    });

    return createSuccessResponse({
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const appError = error as AppError;

    logError(appError, {
      requestId,
      processingTime,
    });

    return createErrorResponse(
      appError.statusCode,
      appError.type,
      appError.message,
      appError.details
    );
  }
};

/**
 * Get execution history
 */
export const getHistoryHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const startTime = Date.now();

  logger.info('Execution history request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Validate HTTP method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    // Authenticate request
    const session = await authenticateRequest(event);
    if (!session) {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Invalid or missing authentication');
    }

    // Get pagination parameters
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const offset = parseInt(event.queryStringParameters?.offset || '0', 10);

    // Get history
    const history = await agentOrchestratorService.getHistory(session.userId, limit, offset);

    const processingTime = Date.now() - startTime;

    logger.info('Execution history retrieved', {
      requestId,
      userId: session.userId,
      count: history.length,
      processingTime,
    });

    return createSuccessResponse({
      success: true,
      data: {
        results: history,
        pagination: {
          total: history.length,
          limit,
          offset,
        },
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const appError = error as AppError;

    logError(appError, {
      requestId,
      processingTime,
    });

    return createErrorResponse(
      appError.statusCode,
      appError.type,
      appError.message,
      appError.details
    );
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
function parseRequestBody(body: string | null): AgentInvocationRequest {
  if (!body) {
    throw new AppError('Request body is required', ErrorType.VALIDATION, 400);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new AppError('Invalid JSON in request body', ErrorType.VALIDATION, 400);
  }
}

/**
 * Validate invocation request
 */
function validateInvocationRequest(request: AgentInvocationRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.agentType) {
    errors.push('agentType is required');
  } else if (!['tlao-plan', 'tlao-grant'].includes(request.agentType)) {
    errors.push('Invalid agentType. Must be "tlao-plan" or "tlao-grant"');
  }

  if (request.agentType === 'tlao-plan' && (!request.documentIds || request.documentIds.length === 0)) {
    errors.push('documentIds are required for tlao-plan agent');
  }

  if (request.agentType === 'tlao-grant' && !request.organizationProfile) {
    errors.push('organizationProfile is required for tlao-grant agent');
  }

  if (request.language && !['en', 'es', 'pt'].includes(request.language)) {
    errors.push('Invalid language. Must be "en", "es", or "pt"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check Free Tier limits
 */
async function checkFreeTierLimits(userId: string): Promise<{ allowed: boolean; message: string }> {
  try {
    // Check rate limit
    const rateLimitResult = await rateLimiterService.getStatus(userId);
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
      };
    }

    // Check token limit
    const tokenResult = await tokenTrackerService.getStatus(userId);
    if (!tokenResult.allowed) {
      return {
        allowed: false,
        message: `Daily token limit exceeded. Maximum: ${tokenResult.dailyLimit} tokens.`,
      };
    }

    // Check storage limit
    const storageResult = await storageTrackerService.getStatus(userId);
    if (!storageResult.allowed) {
      return {
        allowed: false,
        message: `Storage limit exceeded. Maximum: ${StorageTrackerService.formatBytes(storageResult.maxUsage)}.`,
      };
    }

    // Check daily API limit
    const dailyResult = await dailyUsageService.getStatus(userId);
    if (!dailyResult.allowed) {
      return {
        allowed: false,
        message: `Daily API limit exceeded. Maximum: ${dailyResult.dailyLimit} requests.`,
      };
    }

    return { allowed: true, message: '' };
  } catch (error) {
    logger.error('Free Tier check failed', { error: (error as Error).message });
    // Fail open - allow request if Free Tier check fails
    return { allowed: true, message: '' };
  }
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
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, any>
): APIGatewayProxyResult {
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    details,
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    },
    body: JSON.stringify(errorResponse),
  };
}

/**
 * Handle OPTIONS requests for CORS
 */
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  void event;
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-API-Key',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    },
    body: '',
  };
};

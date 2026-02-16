/**
 * Agent orchestrator service for coordinating agent execution
 */

import { AgentType, ProcessedDocument, ExecutionPlan, GrantAssessment } from '../models/types';
import { bedrockService } from './bedrock';
import { dynamoDBService } from './dynamodb';
import { s3Service } from './s3';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { PromptTemplateService } from './prompt-templates';
import { ResponseParserService } from './response-parser';
import { AppError, ErrorType } from '../utils/errors';

/**
 * Agent configuration
 */
export interface AgentConfig {
  userId: string;
  documentIds?: string[];
  organizationProfile?: any;
  language?: string;
  agentType: AgentType;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  resultId: string;
  agentType: AgentType;
  output: ExecutionPlan | GrantAssessment;
  tokensUsed: number;
  processingTimeMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

/**
 * Agent orchestrator service
 */
export class AgentOrchestratorService {
  constructor() {}

  /**
   * Execute an agent with the given configuration
   */
  async executeAgent(config: AgentConfig): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const resultId = `result-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info('Executing agent', {
        agentType: config.agentType,
        userId: config.userId,
        documentIds: config.documentIds?.length,
      });

      // Get documents if provided
      const documents = config.documentIds
        ? await this.getDocuments(config.userId, config.documentIds)
        : [];

      // Get organization profile if provided
      const organizationProfile = config.organizationProfile;

      // Execute agent-specific logic
      let output: ExecutionPlan | GrantAssessment;
      let tokensUsed = 0;

      switch (config.agentType) {
        case 'tlao-plan':
          output = await this.executeTlaoPlan(config.userId, documents, config.language);
          break;
        case 'tlao-grant':
          output = await this.executeTlaoGrant(config.userId, organizationProfile, config.language);
          break;
        default:
          throw new AppError(
            `Unknown agent type: ${config.agentType}`,
            ErrorType.VALIDATION,
            400
          );
      }

      const processingTimeMs = Date.now() - startTime;

      // Store result in DynamoDB
      await this.storeResult({
        resultId,
        userId: config.userId,
        agentType: config.agentType,
        output,
        tokensUsed,
        processingTimeMs,
        status: 'success',
      });

      logger.info('Agent execution completed', {
        resultId,
        agentType: config.agentType,
        processingTimeMs,
        tokensUsed,
      });

      return {
        resultId,
        agentType: config.agentType,
        output,
        tokensUsed,
        processingTimeMs,
        status: 'success',
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const appError = error as AppError;

      logger.error('Agent execution failed', {
        agentType: config.agentType,
        userId: config.userId,
        error: appError.message,
        processingTimeMs,
      });

      // Store error result
      await this.storeResult({
        resultId,
        userId: config.userId,
        agentType: config.agentType,
        output: {} as ExecutionPlan | GrantAssessment,
        tokensUsed: 0,
        processingTimeMs,
        status: 'error',
        errorMessage: appError.message,
      });

      throw appError;
    }
  }

  /**
   * Execute TLÁO Plan agent
   */
  private async executeTlaoPlan(
    _userId: string,
    documents: ProcessedDocument[],
    _language?: string
  ): Promise<ExecutionPlan> {
    // Construct prompt
    const prompt = PromptTemplateService.createOpsCopilotPrompt({
      documents,
      userContext: {
        organizationType: 'founder',
      },
    });

    // Invoke Bedrock
    const response = await bedrockService.invokeModel({
      prompt,
      maxTokens: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature,
    });

    // Parse response
    const result = ResponseParserService.parseExecutionPlan(response.content);

    if (!result.success) {
      throw new AppError(
        `Failed to parse execution plan: ${result.errors.join(', ')}`,
        ErrorType.SERVICE,
        500,
        { errors: result.errors, warnings: result.warnings }
      );
    }

    return result.data!;
  }

  /**
   * Execute TLÁO Grant agent
   */
  private async executeTlaoGrant(
    _userId: string,
    organizationProfile: any,
    _language?: string
  ): Promise<GrantAssessment> {
    if (!organizationProfile) {
      throw new AppError(
        'Organization profile is required for TLÁO Grant',
        ErrorType.VALIDATION,
        400
      );
    }

    // Construct prompt
    const prompt = PromptTemplateService.createGrantNavigatorPrompt({
      organizationProfile,
      language: _language,
    });

    // Invoke Bedrock
    const response = await bedrockService.invokeModel({
      prompt,
      maxTokens: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature,
    });

    // Parse response
    const result = ResponseParserService.parseGrantAssessment(response.content);

    if (!result.success) {
      throw new AppError(
        `Failed to parse grant assessment: ${result.errors.join(', ')}`,
        ErrorType.SERVICE,
        500,
        { errors: result.errors, warnings: result.warnings }
      );
    }

    return result.data!;
  }

  /**
   * Get documents for user
   */
  private async getDocuments(userId: string, documentIds: string[]): Promise<ProcessedDocument[]> {
    try {
      const documents: ProcessedDocument[] = [];

      for (const documentId of documentIds) {
        const document = await dynamoDBService.get(config.dynamodb.documentsTable, {
          userId,
          documentId,
        });

        if (document) {
          // Download content from S3
          const s3Result = await s3Service.download(document.s3Path);
          const textContent = s3Result.body.toString('utf-8');

          documents.push({
            documentId: document.documentId,
            documentType: document.documentType,
            textContent,
            metadata: document.metadata,
          });
        }
      }

      return documents;
    } catch (error) {
      logger.error('Failed to get documents', {
        userId,
        documentIds,
        error: (error as Error).message,
      });
      throw new AppError(
        `Failed to retrieve documents: ${(error as Error).message}`,
        ErrorType.SERVICE,
        500
      );
    }
  }

  /**
   * Store agent result in DynamoDB
   */
  private async storeResult(result: {
    resultId: string;
    userId: string;
    agentType: AgentType;
    output: ExecutionPlan | GrantAssessment;
    tokensUsed: number;
    processingTimeMs: number;
    status: 'success' | 'error';
    errorMessage?: string;
  }): Promise<void> {
    try {
      const item = {
        userId: result.userId,
        resultId: result.resultId,
        agentType: result.agentType,
        createdAt: Date.now(),
        inputDocumentIds: [], // Would be populated from actual documents
        output: result.output,
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
        status: result.status,
        errorMessage: result.errorMessage,
      };

      await dynamoDBService.put(config.dynamodb.resultsTable, item);
    } catch (error) {
      logger.error('Failed to store agent result', {
        resultId: result.resultId,
        userId: result.userId,
        error: (error as Error).message,
      });
      throw new AppError(
        `Failed to store result: ${(error as Error).message}`,
        ErrorType.SERVICE,
        500
      );
    }
  }

  /**
   * Get agent result by ID
   */
  async getResult(resultId: string, userId: string): Promise<any> {
    try {
      const result = await dynamoDBService.get(config.dynamodb.resultsTable, {
        userId,
        resultId,
      });

      if (!result) {
        throw new AppError('Result not found', ErrorType.NOT_FOUND, 404);
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to get agent result', {
        resultId,
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        `Failed to retrieve result: ${(error as Error).message}`,
        ErrorType.SERVICE,
        500
      );
    }
  }

  /**
   * Get execution history for user
   */
  async getHistory(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const result = await dynamoDBService.query({
        tableName: config.dynamodb.resultsTable,
        keyConditionExpression: 'userId = :userId',
        expressionAttributeValues: {
          ':userId': userId,
        },
        limit: limit + offset,
        scanIndexForward: false, // Descending order (newest first)
      });

      // Apply pagination
      const paginatedResults = result.items.slice(offset, offset + limit);

      return paginatedResults;
    } catch (error) {
      logger.error('Failed to get execution history', {
        userId,
        error: (error as Error).message,
      });

      throw new AppError(
        `Failed to retrieve history: ${(error as Error).message}`,
        ErrorType.SERVICE,
        500
      );
    }
  }
}

// Export singleton instance
export const agentOrchestratorService = new AgentOrchestratorService();

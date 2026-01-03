/**
 * AWS Bedrock service wrapper for AI model invocation
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

/**
 * Bedrock invocation parameters
 */
export interface BedrockInvokeParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

/**
 * Bedrock response
 */
export interface BedrockResponse {
  content: string;
  tokensUsed: number;
  finishReason?: string;
  model: string;
}

/**
 * Claude message format for Anthropic models
 */
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Claude request body for Anthropic models
 */
interface ClaudeRequestBody {
  anthropic_version: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  messages: ClaudeMessage[];
  stop_sequences?: string[];
}

/**
 * Claude response body from Anthropic models
 */
interface ClaudeResponseBody {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason?: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * AWS Bedrock service wrapper
 */
export class BedrockService {
  private client: BedrockRuntimeClient;
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: config.aws.region });
  }

  /**
   * Invoke Claude model with retry logic
   */
  async invokeModel(params: BedrockInvokeParams): Promise<BedrockResponse> {
    return this.withRetry(async () => {
      const startTime = Date.now();
      
      logger.debug('Invoking Bedrock model', {
        model: config.bedrock.modelId,
        promptLength: params.prompt.length,
        maxTokens: params.maxTokens || config.bedrock.maxTokens,
      });

      // Prepare request body based on model type
      const requestBody = this.prepareRequestBody(params);
      
      const command = new InvokeModelCommand({
        modelId: config.bedrock.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
      });

      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      // Parse response based on model type
      const result = this.parseResponse(response.body);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Bedrock model invocation completed', {
        model: config.bedrock.modelId,
        tokensUsed: result.tokensUsed,
        processingTime,
        contentLength: result.content.length,
      });

      return result;
    });
  }

  /**
   * Prepare request body based on model type
   */
  private prepareRequestBody(params: BedrockInvokeParams): ClaudeRequestBody {
    // For Claude models (Anthropic)
    if (config.bedrock.modelId.includes('claude')) {
      return {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: params.maxTokens || config.bedrock.maxTokens,
        temperature: params.temperature ?? config.bedrock.temperature,
        top_p: params.topP ?? 0.9,
        messages: [
          {
            role: 'user',
            content: params.prompt,
          },
        ],
        stop_sequences: params.stopSequences,
      };
    }

    // For other models, you would add different request formats here
    throw new Error(`Unsupported model: ${config.bedrock.modelId}`);
  }

  /**
   * Parse response based on model type
   */
  private parseResponse(responseBody: Uint8Array): BedrockResponse {
    const responseText = new TextDecoder().decode(responseBody);
    
    try {
      // For Claude models (Anthropic)
      if (config.bedrock.modelId.includes('claude')) {
        const claudeResponse: ClaudeResponseBody = JSON.parse(responseText);
        
        const content = claudeResponse.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('');

        return {
          content,
          tokensUsed: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
          finishReason: claudeResponse.stop_reason,
          model: claudeResponse.model,
        };
      }

      // For other models, you would add different parsing logic here
      throw new Error(`Unsupported model response format: ${config.bedrock.modelId}`);
    } catch (error) {
      logger.error('Failed to parse Bedrock response', {
        model: config.bedrock.modelId,
        responseText: responseText.substring(0, 500),
        error: (error as Error).message,
      });
      throw new Error(`Failed to parse model response: ${(error as Error).message}`);
    }
  }

  /**
   * Generate structured prompt for agents
   */
  static createStructuredPrompt(
    systemPrompt: string,
    userInput: string,
    context?: string,
    examples?: string[]
  ): string {
    let prompt = systemPrompt + '\n\n';

    if (context) {
      prompt += `Context:\n${context}\n\n`;
    }

    if (examples && examples.length > 0) {
      prompt += 'Examples:\n';
      examples.forEach((example, index) => {
        prompt += `${index + 1}. ${example}\n`;
      });
      prompt += '\n';
    }

    prompt += `User Input:\n${userInput}\n\n`;
    prompt += 'Please provide your response in the requested format:';

    return prompt;
  }

  /**
   * Validate JSON response from model
   */
  static validateJsonResponse<T>(response: string, schema?: (obj: any) => obj is T): T {
    try {
      // Clean response - remove markdown code blocks if present
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      if (schema && !schema(parsed)) {
        throw new Error('Response does not match expected schema');
      }

      return parsed;
    } catch (error) {
      logger.error('Failed to validate JSON response', {
        response: response.substring(0, 500),
        error: (error as Error).message,
      });
      throw new Error(`Invalid JSON response from model: ${(error as Error).message}`);
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Calculate delay with exponential backoff
        const delayMs = this.baseDelayMs * Math.pow(2, attempt);
        
        logger.warn(`Bedrock operation failed, retrying in ${delayMs}ms`, {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          error: (error as Error).message,
        });

        await this.sleep(delayMs);
      }
    }

    logger.error('Bedrock operation failed after all retries', {
      maxRetries: this.maxRetries,
      error: lastError?.message,
    });

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableErrors = [
      'ValidationException',
      'AccessDeniedException',
      'ResourceNotFoundException',
    ];

    return nonRetryableErrors.includes(error.name) || 
           (error.$metadata?.httpStatusCode >= 400 && error.$metadata?.httpStatusCode < 500);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate token count (rough approximation)
   */
  static estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to fit within token limit
   */
  static truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokenCount(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Truncate to approximately fit within token limit
    const maxChars = maxTokens * 4;
    const truncated = text.substring(0, maxChars);
    
    // Try to truncate at word boundary
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > maxChars * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }

  /**
   * Calculate cost estimate for model invocation
   */
  static estimateCost(inputTokens: number, outputTokens: number): number {
    // Claude 3 Sonnet pricing (as of 2024):
    // Input: $0.003 per 1K tokens
    // Output: $0.015 per 1K tokens
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    
    return inputCost + outputCost;
  }
}

// Export singleton instance
export const bedrockService = new BedrockService();
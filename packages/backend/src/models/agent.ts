/**
 * Agent interface and base implementation
 */

import { AgentType, ProcessedDocument, ExecutionPlan, GrantAssessment } from './types';

/**
 * Configuration for agent execution
 */
export interface AgentConfig {
  userId: string;
  documents?: ProcessedDocument[];
  language?: string;
  additionalContext?: Record<string, any>;
}

/**
 * Result of agent processing
 */
export interface AgentProcessResult {
  output: ExecutionPlan | GrantAssessment;
  tokensUsed: number;
  processingTimeMs: number;
}

/**
 * Base Agent interface that all specialized agents must implement
 */
export interface Agent {
  /**
   * The type of agent
   */
  readonly agentType: AgentType;

  /**
   * Process documents and generate structured output
   * @param config - Agent configuration including documents and context
   * @returns Promise resolving to agent output
   */
  process(config: AgentConfig): Promise<AgentProcessResult>;

  /**
   * Validate agent output against schema
   * @param output - Output to validate
   * @returns True if valid, false otherwise
   */
  validate(output: ExecutionPlan | GrantAssessment): boolean;
}

/**
 * Abstract base class for agents with common functionality
 */
export abstract class BaseAgent implements Agent {
  abstract readonly agentType: AgentType;

  abstract process(config: AgentConfig): Promise<AgentProcessResult>;

  abstract validate(output: ExecutionPlan | GrantAssessment): boolean;

  /**
   * Helper to construct document context for prompts
   */
  protected constructDocumentContext(documents: ProcessedDocument[]): string {
    return documents
      .map((doc, index) => {
        return `Document ${index + 1} (${doc.documentType}):\n${doc.textContent}\n`;
      })
      .join('\n---\n\n');
  }

  /**
   * Helper to measure processing time
   */
  protected async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const startTime = Date.now();
    const result = await fn();
    const timeMs = Date.now() - startTime;
    return { result, timeMs };
  }
}

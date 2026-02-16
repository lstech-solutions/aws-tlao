/**
 * TLÁO Plan agent implementation
 */

import { AgentType, ExecutionPlan, Alert, Task, ExecutionMetrics } from '../models/types';
import { BaseAgent, AgentConfig, AgentProcessResult } from '../models/agent';
import { bedrockService } from '../services/bedrock';
import { logger } from '../utils/logger';
import { PromptTemplateService } from '../services/prompt-templates';
import { ResponseParserService } from '../services/response-parser';
import { AppError, ErrorType } from '../utils/errors';

/**
 * TLÁO Plan agent implementation
 */
export class TlaoPlanAgent extends BaseAgent {
  readonly agentType: AgentType = 'tlao-plan';

  /**
   * Process documents and generate execution plan
   */
  async process(config: AgentConfig): Promise<AgentProcessResult> {
    const startTime = Date.now();

    try {
      logger.info('TLÁO Plan agent processing', {
        userId: config.userId,
        documentCount: config.documents?.length || 0,
        language: config.language,
      });

      // Construct prompt
      const prompt = PromptTemplateService.createOpsCopilotPrompt({
        documents: config.documents || [],
        userContext: {
          organizationType: 'founder',
        },
      });

      // Invoke Bedrock
      const response = await bedrockService.invokeModel({
        prompt,
        maxTokens: 2000,
        temperature: 0.7,
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

      const processingTimeMs = Date.now() - startTime;

      logger.info('TLÁO Plan agent completed', {
        userId: config.userId,
        taskCount: result.data!.executionPlan.length,
        alertCount: result.data!.alerts.length,
        processingTimeMs,
        tokensUsed: response.tokensUsed,
      });

      return {
        output: result.data!,
        tokensUsed: response.tokensUsed,
        processingTimeMs,
      };
    } catch (error) {
      logger.error('TLÁO Plan agent failed', {
        userId: config.userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate execution plan output
   */
  validate(output: ExecutionPlan): boolean {
    // Check required fields
    if (!output.executionPlan || !Array.isArray(output.executionPlan)) {
      return false;
    }

    if (!output.alerts || !Array.isArray(output.alerts)) {
      return false;
    }

    if (!output.metrics) {
      return false;
    }

    // Validate tasks
    const taskIds = new Set<string>();
    for (const task of output.executionPlan) {
      if (!this.validateTask(task)) {
        return false;
      }

      // Check for duplicate task IDs
      if (taskIds.has(task.taskId)) {
        return false;
      }
      taskIds.add(task.taskId);
    }

    // Validate metrics
    if (!this.validateMetrics(output.metrics)) {
      return false;
    }

    // Check metrics consistency
    if (output.metrics.totalTasks !== output.executionPlan.length) {
      logger.warn('Metrics inconsistency: totalTasks does not match task count');
    }

    const actualHighPriority = output.executionPlan.filter(t => t.priority === 'high').length;
    if (output.metrics.highPriorityCount !== actualHighPriority) {
      logger.warn('Metrics inconsistency: highPriorityCount does not match');
    }

    return true;
  }

  /**
   * Validate a single task
   */
  private validateTask(task: Task): boolean {
    // Check required fields
    if (!task.taskId || typeof task.taskId !== 'string') {
      return false;
    }

    if (!task.title || typeof task.title !== 'string') {
      return false;
    }

    if (!['high', 'medium', 'low'].includes(task.priority)) {
      return false;
    }

    if (!task.owner || typeof task.owner !== 'string') {
      return false;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadlineRegex.test(task.deadline)) {
      return false;
    }

    // Validate deadline is within 7 days
    const deadline = new Date(task.deadline);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    if (deadline < today || deadline > sevenDaysFromNow) {
      logger.warn(`Task deadline ${task.deadline} is not within 7 days`);
      return false;
    }

    if (typeof task.estimatedHours !== 'number' || task.estimatedHours <= 0) {
      return false;
    }

    if (!Array.isArray(task.dependencies)) {
      return false;
    }

    // Check for circular dependencies
    if (task.dependencies.includes(task.taskId)) {
      return false;
    }

    return true;
  }

  /**
   * Validate metrics
   */
  private validateMetrics(metrics: ExecutionMetrics): boolean {
    if (typeof metrics.totalTasks !== 'number') {
      return false;
    }

    if (typeof metrics.highPriorityCount !== 'number') {
      return false;
    }

    if (typeof metrics.blockedCount !== 'number') {
      return false;
    }

    if (typeof metrics.estimatedWeeklyHours !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * Generate alerts for blocked tasks
   */
  generateAlerts(executionPlan: Task[]): Alert[] {
    const alerts: Alert[] = [];
    const taskMap = new Map<string, Task>();

    // Build task map for dependency lookup
    for (const task of executionPlan) {
      taskMap.set(task.taskId, task);
    }

    // Check for blocked tasks (dependencies that don't exist)
    for (const task of executionPlan) {
      for (const depId of task.dependencies) {
        if (!taskMap.has(depId)) {
          alerts.push({
            severity: 'warning',
            message: `Task "${task.title}" depends on non-existent task: ${depId}`,
            affectedTasks: [task.taskId],
          });
        }
      }
    }

    // Check for high-priority tasks with no dependencies (potential blockers)
    const highPriorityTasks = executionPlan.filter(t => t.priority === 'high');
    if (highPriorityTasks.length > 3) {
      alerts.push({
        severity: 'warning',
        message: `High number of high-priority tasks (${highPriorityTasks.length}) may indicate scope creep`,
        affectedTasks: highPriorityTasks.map(t => t.taskId),
      });
    }

    return alerts;
  }

  /**
   * Calculate execution plan metrics
   */
  calculateMetrics(executionPlan: Task[]): ExecutionMetrics {
    const totalTasks = executionPlan.length;
    const highPriorityCount = executionPlan.filter(t => t.priority === 'high').length;
    const blockedCount = executionPlan.filter(t => t.dependencies.length > 0).length;
    const estimatedWeeklyHours = executionPlan.reduce((sum, t) => sum + t.estimatedHours, 0);

    return {
      totalTasks,
      highPriorityCount,
      blockedCount,
      estimatedWeeklyHours,
    };
  }
}

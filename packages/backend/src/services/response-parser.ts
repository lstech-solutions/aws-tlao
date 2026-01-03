/**
 * Response parsing and validation service for AI model outputs
 */

import { ExecutionPlan, GrantAssessment, Task, Alert, Grant, GrantProposal } from '../models/types';
import { logger } from '../utils/logger';

/**
 * Parsing result with validation details
 */
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

/**
 * Response parser service
 */
export class ResponseParserService {
  /**
   * Parse and validate execution plan response
   */
  static parseExecutionPlan(response: string): ParseResult<ExecutionPlan> {
    const result: ParseResult<ExecutionPlan> = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Extract JSON from response
      const jsonStr = this.extractJsonFromResponse(response);
      const parsed = JSON.parse(jsonStr);

      // Validate structure
      const structureValidation = this.validateExecutionPlanStructure(parsed);
      if (!structureValidation.valid) {
        result.errors.push(...structureValidation.errors);
        return result;
      }

      // Validate and clean data
      const cleanedPlan = this.cleanExecutionPlan(parsed);
      const dataValidation = this.validateExecutionPlanData(cleanedPlan);
      
      result.errors.push(...dataValidation.errors);
      result.warnings.push(...dataValidation.warnings);

      if (dataValidation.errors.length === 0) {
        result.success = true;
        result.data = cleanedPlan;
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to parse execution plan: ${(error as Error).message}`);
      return result;
    }
  }

  /**
   * Parse and validate grant assessment response
   */
  static parseGrantAssessment(response: string): ParseResult<GrantAssessment> {
    const result: ParseResult<GrantAssessment> = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Extract JSON from response
      const jsonStr = this.extractJsonFromResponse(response);
      const parsed = JSON.parse(jsonStr);

      // Validate structure
      const structureValidation = this.validateGrantAssessmentStructure(parsed);
      if (!structureValidation.valid) {
        result.errors.push(...structureValidation.errors);
        return result;
      }

      // Validate and clean data
      const cleanedAssessment = this.cleanGrantAssessment(parsed);
      const dataValidation = this.validateGrantAssessmentData(cleanedAssessment);
      
      result.errors.push(...dataValidation.errors);
      result.warnings.push(...dataValidation.warnings);

      if (dataValidation.errors.length === 0) {
        result.success = true;
        result.data = cleanedAssessment;
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to parse grant assessment: ${(error as Error).message}`);
      return result;
    }
  }

  /**
   * Extract JSON from model response
   */
  private static extractJsonFromResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON object boundaries
    const startIndex = cleaned.indexOf('{');
    const lastIndex = cleaned.lastIndexOf('}');

    if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
      throw new Error('No valid JSON object found in response');
    }

    return cleaned.substring(startIndex, lastIndex + 1);
  }

  /**
   * Validate execution plan structure
   */
  private static validateExecutionPlanStructure(obj: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!obj || typeof obj !== 'object') {
      errors.push('Response must be a JSON object');
      return { valid: false, errors };
    }

    if (!Array.isArray(obj.executionPlan)) {
      errors.push('executionPlan must be an array');
    }

    if (!Array.isArray(obj.alerts)) {
      errors.push('alerts must be an array');
    }

    if (!obj.metrics || typeof obj.metrics !== 'object') {
      errors.push('metrics must be an object');
    } else {
      const requiredMetrics = ['totalTasks', 'highPriorityCount', 'blockedCount', 'estimatedWeeklyHours'];
      for (const metric of requiredMetrics) {
        if (typeof obj.metrics[metric] !== 'number') {
          errors.push(`metrics.${metric} must be a number`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate grant assessment structure
   */
  private static validateGrantAssessmentStructure(obj: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!obj || typeof obj !== 'object') {
      errors.push('Response must be a JSON object');
      return { valid: false, errors };
    }

    if (!Array.isArray(obj.grants)) {
      errors.push('grants must be an array');
    }

    if (!Array.isArray(obj.proposals)) {
      errors.push('proposals must be an array');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Clean and normalize execution plan data
   */
  private static cleanExecutionPlan(plan: any): ExecutionPlan {
    return {
      executionPlan: (plan.executionPlan || []).map((task: any) => this.cleanTask(task)),
      alerts: (plan.alerts || []).map((alert: any) => this.cleanAlert(alert)),
      metrics: this.cleanMetrics(plan.metrics || {}),
    };
  }

  /**
   * Clean and normalize grant assessment data
   */
  private static cleanGrantAssessment(assessment: any): GrantAssessment {
    return {
      grants: (assessment.grants || []).map((grant: any) => this.cleanGrant(grant)),
      proposals: (assessment.proposals || []).map((proposal: any) => this.cleanProposal(proposal)),
    };
  }

  /**
   * Clean task data
   */
  private static cleanTask(task: any): Task {
    return {
      taskId: String(task.taskId || '').trim() || `task-${Date.now()}-${Math.random()}`,
      title: String(task.title || '').trim() || 'Untitled Task',
      priority: this.validatePriority(task.priority),
      owner: String(task.owner || '').trim() || 'founder',
      deadline: this.validateDeadline(task.deadline),
      estimatedHours: Math.max(0, Number(task.estimatedHours) || 1),
      dependencies: Array.isArray(task.dependencies) 
        ? task.dependencies.map((dep: any) => String(dep).trim()).filter(Boolean)
        : [],
    };
  }

  /**
   * Clean alert data
   */
  private static cleanAlert(alert: any): Alert {
    return {
      severity: this.validateAlertSeverity(alert.severity),
      message: String(alert.message || '').trim() || 'No message provided',
      affectedTasks: Array.isArray(alert.affectedTasks)
        ? alert.affectedTasks.map((task: any) => String(task).trim()).filter(Boolean)
        : [],
    };
  }

  /**
   * Clean metrics data
   */
  private static cleanMetrics(metrics: any): ExecutionPlan['metrics'] {
    return {
      totalTasks: Math.max(0, Number(metrics.totalTasks) || 0),
      highPriorityCount: Math.max(0, Number(metrics.highPriorityCount) || 0),
      blockedCount: Math.max(0, Number(metrics.blockedCount) || 0),
      estimatedWeeklyHours: Math.max(0, Number(metrics.estimatedWeeklyHours) || 0),
    };
  }

  /**
   * Clean grant data
   */
  private static cleanGrant(grant: any): Grant {
    return {
      grantId: String(grant.grantId || '').trim() || `grant-${Date.now()}-${Math.random()}`,
      name: String(grant.name || '').trim() || 'Unnamed Grant',
      funder: String(grant.funder || '').trim() || 'Unknown Funder',
      amount: Math.max(0, Number(grant.amount) || 0),
      deadline: this.validateDeadline(grant.deadline),
      eligibilityScore: Math.min(100, Math.max(0, Number(grant.eligibilityScore) || 0)),
      matchReasons: Array.isArray(grant.matchReasons)
        ? grant.matchReasons.map((reason: any) => String(reason).trim()).filter(Boolean)
        : [],
      url: this.validateUrl(grant.url),
    };
  }

  /**
   * Clean proposal data
   */
  private static cleanProposal(proposal: any): GrantProposal {
    const budget = proposal.budget || {};
    
    return {
      grantId: String(proposal.grantId || '').trim(),
      executiveSummary: String(proposal.executiveSummary || '').trim() || 'No summary provided',
      problemStatement: String(proposal.problemStatement || '').trim() || 'No problem statement provided',
      solution: String(proposal.solution || '').trim() || 'No solution provided',
      budget: {
        personnel: Math.max(0, Number(budget.personnel) || 0),
        equipment: Math.max(0, Number(budget.equipment) || 0),
        operations: Math.max(0, Number(budget.operations) || 0),
        total: Math.max(0, Number(budget.total) || 0),
        ...budget, // Include any additional budget categories
      },
      impactMetrics: Array.isArray(proposal.impactMetrics)
        ? proposal.impactMetrics.map((metric: any) => String(metric).trim()).filter(Boolean)
        : [],
    };
  }

  /**
   * Validate execution plan data
   */
  private static validateExecutionPlanData(plan: ExecutionPlan): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate tasks
    const taskIds = new Set<string>();
    for (const task of plan.executionPlan) {
      // Check for duplicate task IDs
      if (taskIds.has(task.taskId)) {
        errors.push(`Duplicate task ID: ${task.taskId}`);
      }
      taskIds.add(task.taskId);

      // Validate dependencies
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId) && !plan.executionPlan.some(t => t.taskId === depId)) {
          warnings.push(`Task ${task.taskId} depends on non-existent task: ${depId}`);
        }
      }

      // Check for circular dependencies (simplified check)
      if (task.dependencies.includes(task.taskId)) {
        errors.push(`Task ${task.taskId} cannot depend on itself`);
      }
    }

    // Validate metrics consistency
    if (plan.metrics.totalTasks !== plan.executionPlan.length) {
      warnings.push(`Metrics totalTasks (${plan.metrics.totalTasks}) doesn't match actual task count (${plan.executionPlan.length})`);
    }

    const actualHighPriority = plan.executionPlan.filter(t => t.priority === 'high').length;
    if (plan.metrics.highPriorityCount !== actualHighPriority) {
      warnings.push(`Metrics highPriorityCount (${plan.metrics.highPriorityCount}) doesn't match actual count (${actualHighPriority})`);
    }

    return { errors, warnings };
  }

  /**
   * Validate grant assessment data
   */
  private static validateGrantAssessmentData(assessment: GrantAssessment): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate grants
    const grantIds = new Set<string>();
    for (const grant of assessment.grants) {
      if (grantIds.has(grant.grantId)) {
        errors.push(`Duplicate grant ID: ${grant.grantId}`);
      }
      grantIds.add(grant.grantId);

      if (grant.eligibilityScore < 0 || grant.eligibilityScore > 100) {
        errors.push(`Invalid eligibility score for grant ${grant.grantId}: ${grant.eligibilityScore}`);
      }

      if (grant.amount <= 0) {
        warnings.push(`Grant ${grant.grantId} has zero or negative amount: ${grant.amount}`);
      }
    }

    // Validate proposals reference existing grants
    for (const proposal of assessment.proposals) {
      if (!grantIds.has(proposal.grantId)) {
        errors.push(`Proposal references non-existent grant: ${proposal.grantId}`);
      }

      // Validate budget totals
      const calculatedTotal = proposal.budget.personnel + proposal.budget.equipment + proposal.budget.operations;
      if (Math.abs(proposal.budget.total - calculatedTotal) > 1) {
        warnings.push(`Budget total mismatch for proposal ${proposal.grantId}: stated ${proposal.budget.total}, calculated ${calculatedTotal}`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate priority value
   */
  private static validatePriority(priority: any): 'high' | 'medium' | 'low' {
    const validPriorities = ['high', 'medium', 'low'];
    const normalized = String(priority || '').toLowerCase().trim();
    
    if (validPriorities.includes(normalized)) {
      return normalized as 'high' | 'medium' | 'low';
    }
    
    return 'medium'; // Default fallback
  }

  /**
   * Validate alert severity
   */
  private static validateAlertSeverity(severity: any): 'critical' | 'warning' | 'info' {
    const validSeverities = ['critical', 'warning', 'info'];
    const normalized = String(severity || '').toLowerCase().trim();
    
    if (validSeverities.includes(normalized)) {
      return normalized as 'critical' | 'warning' | 'info';
    }
    
    return 'info'; // Default fallback
  }

  /**
   * Validate deadline format
   */
  private static validateDeadline(deadline: any): string {
    const dateStr = String(deadline || '').trim();
    
    // Check if it's a valid date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return dateStr;
      }
    }
    
    // Fallback to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Validate URL format
   */
  private static validateUrl(url: any): string {
    const urlStr = String(url || '').trim();
    
    try {
      new URL(urlStr);
      return urlStr;
    } catch {
      return 'https://example.com'; // Fallback URL
    }
  }

  /**
   * Log parsing results for debugging
   */
  static logParsingResult<T>(result: ParseResult<T>, context: string): void {
    if (result.success) {
      logger.info(`Successfully parsed ${context}`, {
        warnings: result.warnings.length,
      });
      
      if (result.warnings.length > 0) {
        logger.warn(`Parsing warnings for ${context}`, {
          warnings: result.warnings,
        });
      }
    } else {
      logger.error(`Failed to parse ${context}`, {
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }
}
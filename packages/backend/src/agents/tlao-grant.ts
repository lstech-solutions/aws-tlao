/**
 * TLÁO Grant agent implementation
 */

import { AgentType, GrantAssessment, Grant, GrantProposal } from '../models/types';
import { BaseAgent, AgentConfig, AgentProcessResult } from '../models/agent';
import { bedrockService } from '../services/bedrock';
import { logger } from '../utils/logger';
import { PromptTemplateService } from '../services/prompt-templates';
import { ResponseParserService } from '../services/response-parser';
import { AppError, ErrorType } from '../utils/errors';

/**
 * TLÁO Grant agent implementation
 */
export class TlaoGrantAgent extends BaseAgent {
  readonly agentType: AgentType = 'tlao-grant';

  /**
   * Process organization profile and generate grant assessment
   */
  async process(config: AgentConfig): Promise<AgentProcessResult> {
    const startTime = Date.now();

    try {
      logger.info('TLÁO Grant agent processing', {
        userId: config.userId,
        language: config.language,
      });

      // Get organization profile from config
      const organizationProfile = config.additionalContext?.organizationProfile;
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
        language: config.language,
      });

      // Invoke Bedrock
      const response = await bedrockService.invokeModel({
        prompt,
        maxTokens: 2000,
        temperature: 0.7,
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

      const processingTimeMs = Date.now() - startTime;

      logger.info('TLÁO Grant agent completed', {
        userId: config.userId,
        grantCount: result.data!.grants.length,
        proposalCount: result.data!.proposals.length,
        processingTimeMs,
        tokensUsed: response.tokensUsed,
      });

      return {
        output: result.data!,
        tokensUsed: response.tokensUsed,
        processingTimeMs,
      };
    } catch (error) {
      logger.error('TLÁO Grant agent failed', {
        userId: config.userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate grant assessment output
   */
  validate(output: GrantAssessment): boolean {
    // Check required fields
    if (!output.grants || !Array.isArray(output.grants)) {
      return false;
    }

    if (!output.proposals || !Array.isArray(output.proposals)) {
      return false;
    }

    // Validate grants
    const grantIds = new Set<string>();
    for (const grant of output.grants) {
      if (!this.validateGrant(grant)) {
        return false;
      }

      // Check for duplicate grant IDs
      if (grantIds.has(grant.grantId)) {
        return false;
      }
      grantIds.add(grant.grantId);
    }

    // Validate proposals
    for (const proposal of output.proposals) {
      if (!this.validateProposal(proposal)) {
        return false;
      }

      // Check that proposal references a valid grant
      if (!grantIds.has(proposal.grantId)) {
        return false;
      }
    }

    // Check that proposals reference grants from the same list
    const proposalGrantIds = new Set(output.proposals.map(p => p.grantId));
    for (const grantId of proposalGrantIds) {
      if (!grantIds.has(grantId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate a single grant
   */
  private validateGrant(grant: Grant): boolean {
    // Check required fields
    if (!grant.grantId || typeof grant.grantId !== 'string') {
      return false;
    }

    if (!grant.name || typeof grant.name !== 'string') {
      return false;
    }

    if (!grant.funder || typeof grant.funder !== 'string') {
      return false;
    }

    if (typeof grant.amount !== 'number' || grant.amount < 0) {
      return false;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadlineRegex.test(grant.deadline)) {
      return false;
    }

    // Validate eligibility score (0-100)
    if (typeof grant.eligibilityScore !== 'number' || grant.eligibilityScore < 0 || grant.eligibilityScore > 100) {
      return false;
    }

    if (!Array.isArray(grant.matchReasons)) {
      return false;
    }

    if (!grant.url || typeof grant.url !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Validate a single proposal
   */
  private validateProposal(proposal: GrantProposal): boolean {
    // Check required fields
    if (!proposal.grantId || typeof proposal.grantId !== 'string') {
      return false;
    }

    if (!proposal.executiveSummary || typeof proposal.executiveSummary !== 'string') {
      return false;
    }

    if (!proposal.problemStatement || typeof proposal.problemStatement !== 'string') {
      return false;
    }

    if (!proposal.solution || typeof proposal.solution !== 'string') {
      return false;
    }

    // Validate budget
    const budget = proposal.budget;
    if (typeof budget !== 'object' || budget === null) {
      return false;
    }

    // Check budget totals
    const calculatedTotal = (budget.personnel || 0) + (budget.equipment || 0) + (budget.operations || 0);
    if (Math.abs((budget.total || 0) - calculatedTotal) > 1) {
      logger.warn(`Budget total mismatch for proposal ${proposal.grantId}`);
    }

    if (!Array.isArray(proposal.impactMetrics)) {
      return false;
    }

    return true;
  }

  /**
   * Filter grants by minimum eligibility score
   */
  filterGrantsByEligibility(grants: Grant[], minScore: number = 60): Grant[] {
    return grants.filter(grant => grant.eligibilityScore >= minScore);
  }

  /**
   * Sort grants by eligibility score (descending)
   */
  sortGrantsByScore(grants: Grant[]): Grant[] {
    return [...grants].sort((a, b) => b.eligibilityScore - a.eligibilityScore);
  }

  /**
   * Generate proposal for a grant
   */
  generateProposal(grant: Grant, organizationProfile: any): GrantProposal {
    return {
      grantId: grant.grantId,
      executiveSummary: `This proposal outlines how ${organizationProfile.name || 'the organization'} will leverage the ${grant.name} grant to address ${grant.matchReasons[0] || 'key challenges'}.`,
      problemStatement: `The organization faces challenges in ${organizationProfile.focusAreas?.[0] || 'its core mission'}. Without external funding, it will be difficult to scale impact.`,
      solution: `With the ${grant.name} support, the organization will implement ${organizationProfile.mission || 'its mission-driven programs'}.`,
      budget: {
        personnel: Math.round(grant.amount * 0.5),
        equipment: Math.round(grant.amount * 0.2),
        operations: Math.round(grant.amount * 0.2),
        total: grant.amount,
      },
      impactMetrics: [
        `Serve ${Math.round(organizationProfile.teamSize || 10) * 100} beneficiaries`,
        `Achieve ${grant.matchReasons[0] || 'measurable impact'}`,
        `Generate ${Math.round(grant.amount * 0.1)} in matching funds`,
      ],
    };
  }
}

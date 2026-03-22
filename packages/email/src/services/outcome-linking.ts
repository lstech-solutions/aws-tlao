import { v4 as uuidv4 } from 'uuid'
import { dynamoDBService } from '../lib/dynamodb'

export interface ArtifactProposal {
  proposalId: string
  type: 'action_item' | 'decision' | 'risk' | 'opportunity'
  content: string
  confidence: number
}

interface OutcomeLink {
  workspaceId: string
  messageId: string
  outcomeIds: string[]
  createdAt: number
}

interface RoutingRule {
  workspaceId: string
  pattern: string
  outcomeId: string
  createdAt: number
}

export class OutcomeLinkingService {
  private outcomeLinkTableName = 'tlao-email-outcome-links'
  private artifactProposalTableName = 'tlao-email-artifact-proposals'
  private routingRuleTableName = 'tlao-email-routing-rules'

  /**
   * Analyze email content for outcome references
   * Looks for patterns like "OUTCOME-123", "outcome: grant-2024", etc.
   */
  async analyzeContentForOutcomes(emailContent: string): Promise<string[]> {
    const outcomeIds: string[] = []

    // Pattern 1: OUTCOME-{id}
    const outcomePattern = /OUTCOME-([A-Z0-9]+)/g
    let match
    while ((match = outcomePattern.exec(emailContent)) !== null) {
      outcomeIds.push(`OUTCOME-${match[1]}`)
    }

    // Pattern 2: outcome: {id}
    const outcomeColonPattern = /outcome:\s*([A-Za-z0-9-]+)/gi
    while ((match = outcomeColonPattern.exec(emailContent)) !== null) {
      outcomeIds.push(match[1])
    }

    // Pattern 3: #outcome-{id}
    const outcomeHashPattern = /#outcome-([A-Za-z0-9-]+)/gi
    while ((match = outcomeHashPattern.exec(emailContent)) !== null) {
      outcomeIds.push(`outcome-${match[1]}`)
    }

    // Remove duplicates
    return Array.from(new Set(outcomeIds))
  }

  /**
   * Link email to outcomes
   */
  async linkEmailToOutcomes(
    workspaceId: string,
    messageId: string,
    outcomeIds: string[]
  ): Promise<void> {
    if (outcomeIds.length === 0) {
      return
    }

    try {
      const link: OutcomeLink = {
        workspaceId,
        messageId,
        outcomeIds,
        createdAt: Date.now(),
      }

      await dynamoDBService.put(this.outcomeLinkTableName, link)

      this.logToCloudWatch('outcome-linking', 'Linked email to outcomes', {
        workspaceId,
        messageId,
        outcomeCount: outcomeIds.length,
      })
    } catch (error) {
      this.logToCloudWatch('outcome-linking', 'Failed to link email to outcomes', {
        workspaceId,
        messageId,
        error: (error as Error).message,
      })
      throw error
    }
  }

  /**
   * Analyze email content for artifact generation opportunities
   * Looks for patterns like "action item:", "decision:", "risk:", etc.
   */
  async analyzeContentForArtifacts(emailContent: string): Promise<ArtifactProposal[]> {
    const proposals: ArtifactProposal[] = []

    // Pattern 1: Action items
    const actionPattern = /action\s+item[s]?:\s*([^\n]+)/gi
    let match
    while ((match = actionPattern.exec(emailContent)) !== null) {
      proposals.push({
        proposalId: uuidv4(),
        type: 'action_item',
        content: match[1].trim(),
        confidence: 0.9,
      })
    }

    // Pattern 2: Decisions
    const decisionPattern = /decision:\s*([^\n]+)/gi
    while ((match = decisionPattern.exec(emailContent)) !== null) {
      proposals.push({
        proposalId: uuidv4(),
        type: 'decision',
        content: match[1].trim(),
        confidence: 0.85,
      })
    }

    // Pattern 3: Risks
    const riskPattern = /risk:\s*([^\n]+)/gi
    while ((match = riskPattern.exec(emailContent)) !== null) {
      proposals.push({
        proposalId: uuidv4(),
        type: 'risk',
        content: match[1].trim(),
        confidence: 0.8,
      })
    }

    // Pattern 4: Opportunities
    const opportunityPattern = /opportunity:\s*([^\n]+)/gi
    while ((match = opportunityPattern.exec(emailContent)) !== null) {
      proposals.push({
        proposalId: uuidv4(),
        type: 'opportunity',
        content: match[1].trim(),
        confidence: 0.75,
      })
    }

    return proposals
  }

  /**
   * Create artifact proposal for user review
   */
  async createArtifactProposal(
    workspaceId: string,
    messageId: string,
    proposal: ArtifactProposal
  ): Promise<void> {
    try {
      const record = {
        workspaceId,
        proposalId: proposal.proposalId,
        messageId,
        type: proposal.type,
        content: proposal.content,
        confidence: proposal.confidence,
        createdAt: Date.now(),
        status: 'pending_review',
      }

      await dynamoDBService.put(this.artifactProposalTableName, record)

      this.logToCloudWatch('outcome-linking', 'Created artifact proposal', {
        workspaceId,
        messageId,
        proposalId: proposal.proposalId,
        type: proposal.type,
      })
    } catch (error) {
      this.logToCloudWatch('outcome-linking', 'Failed to create artifact proposal', {
        workspaceId,
        messageId,
        error: (error as Error).message,
      })
      throw error
    }
  }

  /**
   * Store routing rule that maps email patterns to outcomes
   */
  async createRoutingRule(workspaceId: string, pattern: string, outcomeId: string): Promise<void> {
    try {
      const rule: RoutingRule = {
        workspaceId,
        pattern,
        outcomeId,
        createdAt: Date.now(),
      }

      await dynamoDBService.put(this.routingRuleTableName, rule)

      this.logToCloudWatch('outcome-linking', 'Created routing rule', {
        workspaceId,
        pattern,
        outcomeId,
      })
    } catch (error) {
      this.logToCloudWatch('outcome-linking', 'Failed to create routing rule', {
        workspaceId,
        pattern,
        error: (error as Error).message,
      })
      throw error
    }
  }

  /**
   * Get routing rules for a workspace
   */
  async getRoutingRules(workspaceId: string): Promise<RoutingRule[]> {
    try {
      const rules = (await dynamoDBService.query(
        this.routingRuleTableName,
        'workspaceId = :workspaceId',
        { ':workspaceId': workspaceId }
      )) as any

      return rules.items || []
    } catch (error) {
      this.logToCloudWatch('outcome-linking', 'Failed to get routing rules', {
        workspaceId,
        error: (error as Error).message,
      })
      return []
    }
  }

  private logToCloudWatch(
    logGroup: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString()
    const logMessage = {
      timestamp,
      message,
      context,
    }
    console.log(`[${logGroup}] ${JSON.stringify(logMessage)}`)
  }
}

export const outcomeLinkingService = new OutcomeLinkingService()

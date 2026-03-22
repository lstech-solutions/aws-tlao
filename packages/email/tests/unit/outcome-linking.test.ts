import { ArtifactProposal, OutcomeLinkingService } from '../../src/services/outcome-linking'
import { dynamoDBService } from '../../src/lib/dynamodb'

jest.mock('../../src/lib/dynamodb')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}))

describe('OutcomeLinkingService', () => {
  let outcomeLinkingService: OutcomeLinkingService
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>

  beforeEach(() => {
    jest.clearAllMocks()
    outcomeLinkingService = new OutcomeLinkingService()
  })

  describe('analyzeContentForOutcomes', () => {
    it('finds explicit outcome references', async () => {
      const content = ['OUTCOME-ABC123', 'outcome: GOAL-2024-001', '#outcome-plan-77'].join('\n')

      await expect(outcomeLinkingService.analyzeContentForOutcomes(content)).resolves.toEqual([
        'OUTCOME-ABC123',
        'GOAL-2024-001',
        'outcome-plan-77',
      ])
    })

    it('deduplicates repeated matches', async () => {
      const content = 'outcome: OKR-001 and outcome: OKR-001'

      await expect(outcomeLinkingService.analyzeContentForOutcomes(content)).resolves.toEqual([
        'OKR-001',
      ])
    })

    it('returns an empty list when no patterns are found', async () => {
      await expect(
        outcomeLinkingService.analyzeContentForOutcomes('plain email text only')
      ).resolves.toEqual([])
    })
  })

  describe('linkEmailToOutcomes', () => {
    it('stores a single outcome-link record', async () => {
      mockDynamoDBService.put.mockResolvedValue(undefined)

      await outcomeLinkingService.linkEmailToOutcomes('workspace-123', 'msg-456', [
        'OKR-001',
        'OKR-002',
      ])

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-outcome-links',
        expect.objectContaining({
          workspaceId: 'workspace-123',
          messageId: 'msg-456',
          outcomeIds: ['OKR-001', 'OKR-002'],
        })
      )
    })

    it('does nothing when there are no outcome IDs', async () => {
      await outcomeLinkingService.linkEmailToOutcomes('workspace-123', 'msg-456', [])

      expect(mockDynamoDBService.put).not.toHaveBeenCalled()
    })

    it('propagates DynamoDB errors', async () => {
      mockDynamoDBService.put.mockRejectedValue(new Error('DynamoDB error'))

      await expect(
        outcomeLinkingService.linkEmailToOutcomes('workspace-123', 'msg-456', ['OKR-001'])
      ).rejects.toThrow('DynamoDB error')
    })
  })

  describe('analyzeContentForArtifacts', () => {
    it('extracts action-item, decision, risk, and opportunity proposals', async () => {
      const content = [
        'Action item: Ship the release checklist',
        'Decision: Move Pages to the apex domain',
        'Risk: GitHub Pages certificate delay',
        'Opportunity: Launch branded webmail onboarding',
      ].join('\n')

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content)

      expect(results).toEqual([
        {
          proposalId: 'mock-uuid-1234',
          type: 'action_item',
          content: 'Ship the release checklist',
          confidence: 0.9,
        },
        {
          proposalId: 'mock-uuid-1234',
          type: 'decision',
          content: 'Move Pages to the apex domain',
          confidence: 0.85,
        },
        {
          proposalId: 'mock-uuid-1234',
          type: 'risk',
          content: 'GitHub Pages certificate delay',
          confidence: 0.8,
        },
        {
          proposalId: 'mock-uuid-1234',
          type: 'opportunity',
          content: 'Launch branded webmail onboarding',
          confidence: 0.75,
        },
      ])
    })

    it('returns an empty array when there are no artifact markers', async () => {
      await expect(
        outcomeLinkingService.analyzeContentForArtifacts('regular discussion only')
      ).resolves.toEqual([])
    })
  })

  describe('createArtifactProposal', () => {
    it('stores a pending_review artifact proposal', async () => {
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'decision',
        content: 'Move to GitHub Pages',
        confidence: 0.85,
      }

      mockDynamoDBService.put.mockResolvedValue(undefined)

      await outcomeLinkingService.createArtifactProposal('workspace-123', 'msg-456', proposal)

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-artifact-proposals',
        expect.objectContaining({
          workspaceId: 'workspace-123',
          proposalId: 'prop-789',
          messageId: 'msg-456',
          type: 'decision',
          content: 'Move to GitHub Pages',
          confidence: 0.85,
          status: 'pending_review',
        })
      )
    })
  })

  describe('createRoutingRule', () => {
    it('stores a routing rule record', async () => {
      mockDynamoDBService.put.mockResolvedValue(undefined)

      await outcomeLinkingService.createRoutingRule('workspace-123', 'subject:*grant*', 'OKR-001')

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-routing-rules',
        expect.objectContaining({
          workspaceId: 'workspace-123',
          pattern: 'subject:*grant*',
          outcomeId: 'OKR-001',
        })
      )
    })
  })

  describe('getRoutingRules', () => {
    it('returns routing rules from DynamoDB', async () => {
      mockDynamoDBService.query.mockResolvedValue({
        items: [
          {
            workspaceId: 'workspace-123',
            pattern: 'subject:*grant*',
            outcomeId: 'OKR-001',
            createdAt: Date.now(),
          },
        ],
      } as never)

      await expect(outcomeLinkingService.getRoutingRules('workspace-123')).resolves.toHaveLength(1)
    })

    it('returns an empty list when the query fails', async () => {
      mockDynamoDBService.query.mockRejectedValue(new Error('boom'))

      await expect(outcomeLinkingService.getRoutingRules('workspace-123')).resolves.toEqual([])
    })
  })
})

import * as fc from 'fast-check'
import { OutcomeLinkingService } from '../../src/services/outcome-linking'
import { dynamoDBService } from '../../src/lib/dynamodb'

jest.mock('../../src/lib/dynamodb')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}))

describe('OutcomeLinkingService - Property-Based Tests', () => {
  let outcomeLinkingService: OutcomeLinkingService
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>

  beforeEach(() => {
    jest.clearAllMocks()
    outcomeLinkingService = new OutcomeLinkingService()
  })

  describe('outcome extraction', () => {
    it('deduplicates repeated outcome: references', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 8 }),
          async (outcomeIds) => {
            const content = outcomeIds
              .flatMap((id) => [`outcome: ${id}`, `outcome: ${id}`])
              .join('\n')

            const results = await outcomeLinkingService.analyzeContentForOutcomes(content)

            expect(new Set(results)).toEqual(new Set(outcomeIds))
          }
        ),
        { numRuns: 50 }
      )
    })

    it('stores one combined link record for any non-empty outcome list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 8 }),
          async (workspaceId, messageId, outcomeIds) => {
            mockDynamoDBService.put.mockClear()
            mockDynamoDBService.put.mockResolvedValue(undefined)

            await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds)

            expect(mockDynamoDBService.put).toHaveBeenCalledTimes(1)
            expect(mockDynamoDBService.put).toHaveBeenCalledWith(
              'tlao-email-outcome-links',
              expect.objectContaining({
                workspaceId,
                messageId,
                outcomeIds,
              })
            )
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('artifact generation', () => {
    it('only emits supported artifact types with normalized confidence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          async (hasAction, hasDecision, hasRisk, hasOpportunity) => {
            const lines = [
              hasAction ? 'Action item: Ship the release checklist' : '',
              hasDecision ? 'Decision: Move Pages to the apex domain' : '',
              hasRisk ? 'Risk: Certificate issuance delay' : '',
              hasOpportunity ? 'Opportunity: Launch branded onboarding' : '',
            ].filter(Boolean)

            const proposals = await outcomeLinkingService.analyzeContentForArtifacts(
              lines.join('\n')
            )

            for (const proposal of proposals) {
              expect(['action_item', 'decision', 'risk', 'opportunity']).toContain(proposal.type)
              expect(proposal.confidence).toBeGreaterThanOrEqual(0)
              expect(proposal.confidence).toBeLessThanOrEqual(1)
              expect(proposal.content.length).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 40 }
      )
    })

    it('stores artifact proposals with pending_review status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom<'action_item' | 'decision' | 'risk' | 'opportunity'>(
            'action_item',
            'decision',
            'risk',
            'opportunity'
          ),
          fc.string({ minLength: 5, maxLength: 80 }),
          fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
          async (workspaceId, messageId, type, content, confidence) => {
            mockDynamoDBService.put.mockClear()
            mockDynamoDBService.put.mockResolvedValue(undefined)

            await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, {
              proposalId: 'mock-uuid-1234',
              type,
              content,
              confidence,
            })

            expect(mockDynamoDBService.put).toHaveBeenCalledWith(
              'tlao-email-artifact-proposals',
              expect.objectContaining({
                workspaceId,
                messageId,
                type,
                content,
                confidence,
                status: 'pending_review',
              })
            )
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})

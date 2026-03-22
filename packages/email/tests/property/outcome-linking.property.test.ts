import * as fc from 'fast-check';
import { OutcomeLinkingService } from '../../src/services/outcome-linking';
import { dynamoDBService } from '../../src/lib/dynamodb';

// Mock DynamoDB service
jest.mock('../../src/lib/dynamodb');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('OutcomeLinkingService - Property-Based Tests', () => {
  let outcomeLinkingService: OutcomeLinkingService;
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>;

  beforeEach(() => {
    jest.clearAllMocks();
    outcomeLinkingService = new OutcomeLinkingService();
  });

  /**
   * Property 18: Outcome linking from content
   * For any email signal processed, if the email content references existing outcomes,
   * the TLÁO_Mail_Ingestion should create links between the email and those outcomes.
   * Validates: Requirements 10.1, 10.2
   */
  describe('Property 18: Outcome linking from content', () => {
    it('should find all outcome references in content', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.constantFrom('outcome', 'OKR', 'goal', 'deliverable'),
              fc.stringMatching(/^[A-Z0-9-]+$/)
            ),
            { minLength: 1, maxLength: 10 }
          ),
          async (references) => {
            // Build content with outcome references
            const content = references
              .map(([keyword, id]) => `${keyword}: ${id}`)
              .join('\n');

            const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

            // All outcome IDs should be found
            const expectedIds = new Set(references.map(([, id]) => id));
            const foundIds = new Set(results);

            expect(foundIds).toEqual(expectedIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle content with no outcome references', () => {
      fc.assert(
        fc.property(
          fc.stringFilter((s) => !s.match(/outcome|OKR|goal|deliverable/i)),
          async (content) => {
            const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

            expect(results).toEqual([]);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should deduplicate outcome IDs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 5 }),
          async (outcomeIds) => {
            // Build content with repeated outcome references
            const content = outcomeIds
              .flatMap((id) => [
                `outcome: ${id}`,
                `OKR: ${id}`,
                `goal: ${id}`,
              ])
              .join('\n');

            const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

            // Each outcome ID should appear exactly once
            const uniqueResults = new Set(results);
            expect(uniqueResults.size).toBe(results.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should link emails to outcomes with valid parameters', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 10 }),
          async (workspaceId, messageId, outcomeIds) => {
            mockDynamoDBService.put.mockResolvedValue(undefined);

            await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds);

            // Should create one link per outcome
            expect(mockDynamoDBService.put).toHaveBeenCalledTimes(outcomeIds.length);

            // Each call should have correct structure
            for (let i = 0; i < outcomeIds.length; i++) {
              const callArgs = mockDynamoDBService.put.mock.calls[i];
              expect(callArgs[0]).toBe('tlao-email-outcome-links');
              expect(callArgs[1]).toMatchObject({
                workspaceId,
                messageId,
                outcomeId: outcomeIds[i],
                confidence: expect.any(Number),
                linkedAt: expect.any(Number),
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should set confidence between 0 and 1 for all links', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 5 }),
          async (workspaceId, messageId, outcomeIds) => {
            mockDynamoDBService.put.mockResolvedValue(undefined);

            await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds);

            // Check all confidence values are valid
            for (const call of mockDynamoDBService.put.mock.calls) {
              const confidence = call[1].confidence;
              expect(confidence).toBeGreaterThanOrEqual(0);
              expect(confidence).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should set linkedAt timestamp to current time', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.stringMatching(/^[A-Z0-9-]+$/), { minLength: 1, maxLength: 5 }),
          async (workspaceId, messageId, outcomeIds) => {
            const beforeTime = Date.now();
            mockDynamoDBService.put.mockResolvedValue(undefined);

            await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds);

            const afterTime = Date.now();

            // Check all linkedAt timestamps are within reasonable range
            for (const call of mockDynamoDBService.put.mock.calls) {
              const linkedAt = call[1].linkedAt;
              expect(linkedAt).toBeGreaterThanOrEqual(beforeTime);
              expect(linkedAt).toBeLessThanOrEqual(afterTime);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Artifact proposal generation
   * For any email content, artifact proposals should have valid structure
   * and confidence scores between 0 and 1
   */
  describe('Property: Artifact proposal generation', () => {
    it('should generate proposals with valid confidence scores', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 1000 }), async (content) => {
          const proposals = await outcomeLinkingService.analyzeContentForArtifacts(content);

          // All proposals should have valid confidence
          proposals.forEach((proposal) => {
            expect(proposal.confidence).toBeGreaterThanOrEqual(0);
            expect(proposal.confidence).toBeLessThanOrEqual(1);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should generate proposals with valid types', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 1000 }), async (content) => {
          const proposals = await outcomeLinkingService.analyzeContentForArtifacts(content);

          const validTypes = ['execution_plan', 'grant_draft', 'alert'];
          proposals.forEach((proposal) => {
            expect(validTypes).toContain(proposal.type);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should generate proposals with non-empty reasoning', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 1000 }), async (content) => {
          const proposals = await outcomeLinkingService.analyzeContentForArtifacts(content);

          proposals.forEach((proposal) => {
            expect(proposal.reasoning).toBeDefined();
            expect(proposal.reasoning.length).toBeGreaterThan(0);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should generate proposals with unique IDs', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 1000 }), async (content) => {
          const proposals = await outcomeLinkingService.analyzeContentForArtifacts(content);

          const ids = proposals.map((p) => p.proposalId);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should sort proposals by confidence descending', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 1000 }), async (content) => {
          const proposals = await outcomeLinkingService.analyzeContentForArtifacts(content);

          // Check sorting
          for (let i = 0; i < proposals.length - 1; i++) {
            expect(proposals[i].confidence).toBeGreaterThanOrEqual(proposals[i + 1].confidence);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Artifact proposal creation
   * For any valid artifact proposal, creating it should succeed
   */
  describe('Property: Artifact proposal creation', () => {
    it('should create proposals with valid parameters', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('execution_plan', 'grant_draft', 'alert'),
          fc.float({ min: 0, max: 1 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (workspaceId, messageId, type, confidence, reasoning) => {
            mockDynamoDBService.put.mockResolvedValue(undefined);

            const proposal = {
              proposalId: 'mock-uuid-1234',
              type: type as 'execution_plan' | 'grant_draft' | 'alert',
              confidence,
              reasoning,
            };

            await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal);

            expect(mockDynamoDBService.put).toHaveBeenCalledWith(
              'tlao-email-artifact-proposals',
              expect.objectContaining({
                workspaceId,
                messageId,
                type,
                confidence,
                reasoning,
                status: 'pending',
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should set createdAt timestamp for all proposals', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('execution_plan', 'grant_draft', 'alert'),
          async (workspaceId, messageId, type) => {
            const beforeTime = Date.now();
            mockDynamoDBService.put.mockResolvedValue(undefined);

            const proposal = {
              proposalId: 'mock-uuid-1234',
              type: type as 'execution_plan' | 'grant_draft' | 'alert',
              confidence: 0.8,
              reasoning: 'Test reasoning',
            };

            await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal);

            const afterTime = Date.now();
            const callArgs = mockDynamoDBService.put.mock.calls[0][1];

            expect(callArgs.createdAt).toBeGreaterThanOrEqual(beforeTime);
            expect(callArgs.createdAt).toBeLessThanOrEqual(afterTime);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

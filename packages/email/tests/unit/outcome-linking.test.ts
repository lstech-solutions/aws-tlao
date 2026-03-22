import { OutcomeLinkingService, ArtifactProposal } from '../../src/services/outcome-linking';
import { dynamoDBService } from '../../src/lib/dynamodb';

// Mock DynamoDB service
jest.mock('../../src/lib/dynamodb');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('OutcomeLinkingService', () => {
  let outcomeLinkingService: OutcomeLinkingService;
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>;

  beforeEach(() => {
    jest.clearAllMocks();
    outcomeLinkingService = new OutcomeLinkingService();
  });

  describe('analyzeContentForOutcomes', () => {
    it('should find outcome references with "outcome:" prefix', async () => {
      const content = 'This email discusses outcome: OKR-2024-Q1-001 and outcome: GOAL-2024-001';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toContain('OKR-2024-Q1-001');
      expect(results).toContain('GOAL-2024-001');
      expect(results.length).toBe(2);
    });

    it('should find OKR references', async () => {
      const content = 'We need to achieve OKR: Q1-REVENUE-100K and OKR: Q1-USERS-50K';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toContain('Q1-REVENUE-100K');
      expect(results).toContain('Q1-USERS-50K');
    });

    it('should find goal references', async () => {
      const content = 'Our goal: GOAL-LAUNCH-PRODUCT and goal: GOAL-MARKET-EXPANSION';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toContain('GOAL-LAUNCH-PRODUCT');
      expect(results).toContain('GOAL-MARKET-EXPANSION');
    });

    it('should find deliverable references', async () => {
      const content = 'Deliverable: DEL-API-V2 and deliverable: DEL-DOCS-COMPLETE';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toContain('DEL-API-V2');
      expect(results).toContain('DEL-DOCS-COMPLETE');
    });

    it('should return empty array for content with no outcome references', async () => {
      const content = 'This is just a regular email with no outcome references';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toEqual([]);
    });

    it('should handle null content gracefully', async () => {
      const results = await outcomeLinkingService.analyzeContentForOutcomes(null as any);

      expect(results).toEqual([]);
    });

    it('should handle empty string content', async () => {
      const results = await outcomeLinkingService.analyzeContentForOutcomes('');

      expect(results).toEqual([]);
    });

    it('should handle non-string content gracefully', async () => {
      const results = await outcomeLinkingService.analyzeContentForOutcomes(123 as any);

      expect(results).toEqual([]);
    });

    it('should deduplicate outcome IDs', async () => {
      const content = 'outcome: OKR-001 and outcome: OKR-001 and outcome: OKR-001';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toEqual(['OKR-001']);
      expect(results.length).toBe(1);
    });

    it('should be case-insensitive for keywords', async () => {
      const content = 'OUTCOME: OKR-001 and Outcome: OKR-002 and outcome: OKR-003';

      const results = await outcomeLinkingService.analyzeContentForOutcomes(content);

      expect(results).toContain('OKR-001');
      expect(results).toContain('OKR-002');
      expect(results).toContain('OKR-003');
    });
  });

  describe('linkEmailToOutcomes', () => {
    it('should create links for each outcome ID', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const outcomeIds = ['OKR-001', 'OKR-002', 'OKR-003'];

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds);

      expect(mockDynamoDBService.put).toHaveBeenCalledTimes(3);
      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-outcome-links',
        expect.objectContaining({
          workspaceId,
          messageId,
          outcomeId: 'OKR-001',
          confidence: 0.8,
        })
      );
    });

    it('should throw error when workspaceId is missing', async () => {
      const messageId = 'msg-456';
      const outcomeIds = ['OKR-001'];

      await expect(
        outcomeLinkingService.linkEmailToOutcomes('', messageId, outcomeIds)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when messageId is missing', async () => {
      const workspaceId = 'workspace-123';
      const outcomeIds = ['OKR-001'];

      await expect(
        outcomeLinkingService.linkEmailToOutcomes(workspaceId, '', outcomeIds)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when outcomeIds is empty', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';

      await expect(
        outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, [])
      ).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when outcomeIds is not an array', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';

      await expect(
        outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, null as any)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should set linkedAt timestamp', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const outcomeIds = ['OKR-001'];
      const beforeTime = Date.now();

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds);

      const afterTime = Date.now();
      const callArgs = mockDynamoDBService.put.mock.calls[0][1];

      expect(callArgs.linkedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.linkedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should handle DynamoDB errors', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const outcomeIds = ['OKR-001'];

      mockDynamoDBService.put.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        outcomeLinkingService.linkEmailToOutcomes(workspaceId, messageId, outcomeIds)
      ).rejects.toThrow('DynamoDB error');
    });
  });

  describe('analyzeContentForArtifacts', () => {
    it('should identify execution_plan artifacts from plan keywords', async () => {
      const content = 'We need to create a plan for the project timeline and schedule the milestones';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      const planProposal = results.find((p) => p.type === 'execution_plan');
      expect(planProposal).toBeDefined();
      expect(planProposal?.confidence).toBeGreaterThan(0.5);
    });

    it('should identify grant_draft artifacts from grant keywords', async () => {
      const content = 'We are applying for a grant with a budget of $100,000 for this proposal';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      const grantProposal = results.find((p) => p.type === 'grant_draft');
      expect(grantProposal).toBeDefined();
      expect(grantProposal?.confidence).toBeGreaterThan(0.5);
    });

    it('should identify alert artifacts from alert keywords', async () => {
      const content = 'This is a critical issue that requires urgent attention and immediate action';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      const alertProposal = results.find((p) => p.type === 'alert');
      expect(alertProposal).toBeDefined();
      expect(alertProposal?.confidence).toBeGreaterThan(0.5);
    });

    it('should return empty array for content with no artifact opportunities', async () => {
      const content = 'This is just a regular email with no special keywords';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      expect(results).toEqual([]);
    });

    it('should handle null content gracefully', async () => {
      const results = await outcomeLinkingService.analyzeContentForArtifacts(null as any);

      expect(results).toEqual([]);
    });

    it('should handle empty string content', async () => {
      const results = await outcomeLinkingService.analyzeContentForArtifacts('');

      expect(results).toEqual([]);
    });

    it('should sort proposals by confidence descending', async () => {
      const content = 'We need to plan the grant proposal with urgent timeline';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].confidence).toBeGreaterThanOrEqual(results[i + 1].confidence);
        }
      }
    });

    it('should include reasoning in proposals', async () => {
      const content = 'We need to create a plan for the project';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((proposal) => {
        expect(proposal.reasoning).toBeDefined();
        expect(proposal.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should include suggested content in proposals', async () => {
      const content = 'We need to create a plan for the project timeline';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((proposal) => {
        expect(proposal.suggestedContent).toBeDefined();
        expect(proposal.suggestedContent?.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique proposal IDs', async () => {
      const content = 'We need to plan the grant proposal';

      const results = await outcomeLinkingService.analyzeContentForArtifacts(content);

      const ids = results.map((p) => p.proposalId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('createArtifactProposal', () => {
    it('should create artifact proposal record in DynamoDB', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
        suggestedContent: 'Plan content here',
      };

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal);

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-artifact-proposals',
        expect.objectContaining({
          workspaceId,
          proposalId: proposal.proposalId,
          messageId,
          type: proposal.type,
          confidence: proposal.confidence,
          reasoning: proposal.reasoning,
          suggestedContent: proposal.suggestedContent,
          status: 'pending',
        })
      );
    });

    it('should throw error when workspaceId is missing', async () => {
      const messageId = 'msg-456';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
      };

      await expect(
        outcomeLinkingService.createArtifactProposal('', messageId, proposal)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when messageId is missing', async () => {
      const workspaceId = 'workspace-123';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
      };

      await expect(
        outcomeLinkingService.createArtifactProposal(workspaceId, '', proposal)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should throw error when proposal is missing', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';

      await expect(
        outcomeLinkingService.createArtifactProposal(workspaceId, messageId, null as any)
      ).rejects.toThrow('Invalid parameters');
    });

    it('should set status to pending', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
      };

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal);

      const callArgs = mockDynamoDBService.put.mock.calls[0][1];
      expect(callArgs.status).toBe('pending');
    });

    it('should set createdAt timestamp', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
      };
      const beforeTime = Date.now();

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal);

      const afterTime = Date.now();
      const callArgs = mockDynamoDBService.put.mock.calls[0][1];

      expect(callArgs.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.createdAt).toBeLessThanOrEqual(afterTime);
    });

    it('should handle DynamoDB errors', async () => {
      const workspaceId = 'workspace-123';
      const messageId = 'msg-456';
      const proposal: ArtifactProposal = {
        proposalId: 'prop-789',
        type: 'execution_plan',
        confidence: 0.85,
        reasoning: 'Found plan keywords',
      };

      mockDynamoDBService.put.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        outcomeLinkingService.createArtifactProposal(workspaceId, messageId, proposal)
      ).rejects.toThrow('DynamoDB error');
    });
  });
});

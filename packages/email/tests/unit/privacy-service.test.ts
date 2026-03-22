import { PrivacyService } from '../../src/services/privacy-service';
import { dynamoDBService } from '../../src/lib/dynamodb';

// Mock DynamoDB service
jest.mock('../../src/lib/dynamodb');

describe('PrivacyService', () => {
  let privacyService: PrivacyService;
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>;

  beforeEach(() => {
    jest.clearAllMocks();
    privacyService = new PrivacyService();
  });

  describe('checkOptIn', () => {
    it('should return true when user has opted in', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.get.mockResolvedValue({
        workspaceId,
        mailboxId,
        optedIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await privacyService.checkOptIn(workspaceId, mailboxId);

      expect(result).toBe(true);
      expect(mockDynamoDBService.get).toHaveBeenCalledWith('tlao-email-privacy-optin', {
        workspaceId,
        mailboxId,
      });
    });

    it('should return false when user has not opted in', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.get.mockResolvedValue({
        workspaceId,
        mailboxId,
        optedIn: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await privacyService.checkOptIn(workspaceId, mailboxId);

      expect(result).toBe(false);
    });

    it('should return false when no opt-in record exists', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.get.mockResolvedValue(null);

      const result = await privacyService.checkOptIn(workspaceId, mailboxId);

      expect(result).toBe(false);
    });

    it('should return false on error for safety', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.get.mockRejectedValue(new Error('DynamoDB error'));

      const result = await privacyService.checkOptIn(workspaceId, mailboxId);

      expect(result).toBe(false);
    });
  });

  describe('setOptIn', () => {
    it('should set opt-in preference to true', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await privacyService.setOptIn(workspaceId, mailboxId, true);

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-privacy-optin',
        expect.objectContaining({
          workspaceId,
          mailboxId,
          optedIn: true,
        })
      );
    });

    it('should set opt-in preference to false', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await privacyService.setOptIn(workspaceId, mailboxId, false);

      expect(mockDynamoDBService.put).toHaveBeenCalledWith(
        'tlao-email-privacy-optin',
        expect.objectContaining({
          workspaceId,
          mailboxId,
          optedIn: false,
        })
      );
    });

    it('should throw error on DynamoDB failure', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';

      mockDynamoDBService.put.mockRejectedValue(new Error('DynamoDB error'));

      await expect(privacyService.setOptIn(workspaceId, mailboxId, true)).rejects.toThrow(
        'DynamoDB error'
      );
    });

    it('should update createdAt and updatedAt timestamps', async () => {
      const workspaceId = 'workspace-123';
      const mailboxId = 'mailbox-456';
      const beforeTime = Date.now();

      mockDynamoDBService.put.mockResolvedValue(undefined);

      await privacyService.setOptIn(workspaceId, mailboxId, true);

      const afterTime = Date.now();
      const callArgs = mockDynamoDBService.put.mock.calls[0][1];

      expect(callArgs.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.updatedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.createdAt).toBeLessThanOrEqual(afterTime);
      expect(callArgs.updatedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('applyPrivacyControls', () => {
    it('should return placeholder text when user has not opted in', () => {
      const bodyText = 'This is sensitive personal information';

      const result = privacyService.applyPrivacyControls(bodyText, false);

      expect(result).toBe('(content hidden - user has not opted in to personal email ingestion)');
    });

    it('should return original body text when user has opted in', () => {
      const bodyText = 'This is sensitive personal information';

      const result = privacyService.applyPrivacyControls(bodyText, true);

      expect(result).toBe(bodyText);
    });

    it('should handle empty body text when opted in', () => {
      const bodyText = '';

      const result = privacyService.applyPrivacyControls(bodyText, true);

      expect(result).toBe('');
    });

    it('should handle empty body text when not opted in', () => {
      const bodyText = '';

      const result = privacyService.applyPrivacyControls(bodyText, false);

      expect(result).toBe('(content hidden - user has not opted in to personal email ingestion)');
    });
  });
});

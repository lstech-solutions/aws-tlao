import { EmailRun } from '../types/run';
import { dynamoDBService } from '../lib/dynamodb';

export class RunService {
  async createRun(
    workspaceId: string,
    runId: string,
    agentType: 'PLAN' | 'GRANT',
    sourceMessageId: string
  ): Promise<EmailRun> {
    const run: EmailRun = {
      workspaceId,
      runId,
      agentType,
      source: 'EMAIL',
      sourceMessageId,
      status: 'pending',
      createdAt: Date.now(),
    };

    await dynamoDBService.put('tlao-email-runs', run);
    return run;
  }

  async completeRun(workspaceId: string, runId: string): Promise<void> {
    await dynamoDBService.update(
      'tlao-email-runs',
      { workspaceId, runId },
      'SET #status = :completed, completedAt = :now',
      {
        ':completed': 'completed',
        ':now': Date.now(),
      }
    );
  }

  async failRun(workspaceId: string, runId: string, errorMessage: string): Promise<void> {
    await dynamoDBService.update(
      'tlao-email-runs',
      { workspaceId, runId },
      'SET #status = :error, errorMessage = :msg',
      {
        ':error': 'error',
        ':msg': errorMessage,
      }
    );
  }
}

export const runService = new RunService();

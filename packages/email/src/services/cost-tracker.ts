import { dynamoDBService } from '../lib/dynamodb';

export interface CostEntry {
  workspaceId: string;
  date: string;
  service: 'ec2' | 'bedrock' | 's3' | 'lambda' | 'dynamodb' | 'route53';
  operation: string;
  estimatedCostUsd: number;
  units: number;
}

export interface WorkspaceCostSummary {
  workspaceId: string;
  period: string;
  totalEstimatedCostUsd: number;
  breakdown: Record<string, number>;
  emailCount: number;
  bedrockTokensUsed: number;
  storageBytes: number;
}

export class CostTracker {
  async trackOperation(entry: CostEntry): Promise<void> {
    const dateServiceOp = `${entry.date}#${entry.service}#${entry.operation}`;

    await dynamoDBService.put('tlao-email-cost-tracking', {
      workspaceId: entry.workspaceId,
      dateServiceOp,
      service: entry.service,
      operation: entry.operation,
      estimatedCostUsd: entry.estimatedCostUsd,
      units: entry.units,
      createdAt: Date.now(),
    });
  }

  async getWorkspaceCost(workspaceId: string, month: string): Promise<WorkspaceCostSummary> {
    const result = await dynamoDBService.query(
      'tlao-email-cost-tracking',
      'workspaceId = :workspaceId',
      { ':workspaceId': workspaceId }
    );

    const entries = result.items as any[];
    const breakdown: Record<string, number> = {};
    let totalCost = 0;

    entries.forEach((entry) => {
      if (!breakdown[entry.service]) {
        breakdown[entry.service] = 0;
      }
      breakdown[entry.service] += entry.estimatedCostUsd;
      totalCost += entry.estimatedCostUsd;
    });

    return {
      workspaceId,
      period: month,
      totalEstimatedCostUsd: totalCost,
      breakdown,
      emailCount: 0,
      bedrockTokensUsed: 0,
      storageBytes: 0,
    };
  }

  async getWorkspaceDailyCost(workspaceId: string, date: string): Promise<CostEntry[]> {
    const result = await dynamoDBService.query(
      'tlao-email-cost-tracking',
      'workspaceId = :workspaceId',
      { ':workspaceId': workspaceId }
    );

    return (result.items as any[])
      .filter((entry) => entry.dateServiceOp.startsWith(date))
      .map((entry) => ({
        workspaceId: entry.workspaceId,
        date: entry.dateServiceOp.split('#')[0],
        service: entry.service,
        operation: entry.operation,
        estimatedCostUsd: entry.estimatedCostUsd,
        units: entry.units,
      }));
  }
}

export const costTracker = new CostTracker();

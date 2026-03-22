import { v4 as uuidv4 } from 'uuid';
import { EmailArtifact, ArtifactType } from '../types/run';
import { dynamoDBService } from '../lib/dynamodb';
import { s3Service } from '../lib/s3';

export class ArtifactService {
  async createArtifact(
    runId: string,
    type: ArtifactType,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<EmailArtifact> {
    const artifactId = uuidv4();
    const s3Key = `artifacts/${runId}/${artifactId}.json`;

    // Store in S3
    await s3Service.putObject(s3Key, content, 'application/json');

    // Create DynamoDB record
    const artifact: EmailArtifact = {
      runId,
      artifactId,
      type,
      s3Key,
      createdAt: Date.now(),
      metadata,
    };

    await dynamoDBService.put('tlao-email-artifacts', artifact);
    return artifact;
  }

  async getArtifactsByRun(runId: string): Promise<EmailArtifact[]> {
    const result = await dynamoDBService.query(
      'tlao-email-artifacts',
      'runId = :runId',
      { ':runId': runId }
    );

    return result.items as EmailArtifact[];
  }
}

export const artifactService = new ArtifactService();

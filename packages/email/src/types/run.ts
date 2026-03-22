export type AgentType = 'PLAN' | 'GRANT';
export type RunSource = 'EMAIL' | 'UPLOAD' | 'API' | 'CONNECTOR';
export type RunStatus = 'pending' | 'running' | 'completed' | 'error';
export type ArtifactType = 'execution_plan' | 'grant_draft' | 'alert';

export interface EmailRun {
  workspaceId: string;
  runId: string;
  agentType: AgentType;
  source: RunSource;
  sourceMessageId?: string;
  status: RunStatus;
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
  backendRunId?: string;
  tokensUsed?: number;
}

export interface EmailArtifact {
  runId: string;
  artifactId: string;
  type: ArtifactType;
  s3Key: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionRequest {
  agentType: AgentType;
  source: RunSource;
  sourceMessageId: string;
  emailContent: {
    from: string;
    subject: string;
    body: string;
  };
}

export interface AgentExecutionResponse {
  runId: string;
  status: 'completed' | 'error';
  artifacts: Array<{
    artifactId: string;
    type: string;
    content: string;
  }>;
}

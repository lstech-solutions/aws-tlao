/**
 * Core type definitions for the AI Agent Platform
 */

/**
 * Supported agent types
 */
export type AgentType = 'tlao-plan' | 'tlao-grant';

/**
 * Supported document types
 */
export type DocumentType = 'email' | 'pdf' | 'audio' | 'text' | 'markdown';

/**
 * Task priority levels
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Processing status
 */
export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error';

/**
 * Supported languages for multilingual support
 */
export type Language = 'en' | 'es' | 'pt';

/**
 * Organization types for Grant Navigator
 */
export type OrganizationType = 'founder' | 'ngo' | 'startup';

/**
 * Document metadata stored in DynamoDB
 */
export interface DocumentMetadata {
  userId: string;
  documentId: string;
  uploadTime: number;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  s3Path: string;
  transcriptPath?: string;
  textContent: string;
  metadata?: {
    source?: string;
    sender?: string;
    subject?: string;
  };
}

/**
 * Processed document with extracted text
 */
export interface ProcessedDocument {
  documentId: string;
  documentType: DocumentType;
  textContent: string;
  metadata?: Record<string, any>;
}

/**
 * Task in an execution plan
 */
export interface Task {
  taskId: string;
  title: string;
  priority: Priority;
  owner: string;
  deadline: string;
  estimatedHours: number;
  dependencies: string[];
}

/**
 * Alert in an execution plan
 */
export interface Alert {
  severity: AlertSeverity;
  message: string;
  affectedTasks: string[];
}

/**
 * Metrics for an execution plan
 */
export interface ExecutionMetrics {
  totalTasks: number;
  highPriorityCount: number;
  blockedCount: number;
  estimatedWeeklyHours: number;
}

/**
 * Execution plan output from Ops Copilot
 */
export interface ExecutionPlan {
  executionPlan: Task[];
  alerts: Alert[];
  metrics: ExecutionMetrics;
}

/**
 * Grant information
 */
export interface Grant {
  grantId: string;
  name: string;
  funder: string;
  amount: number;
  deadline: string;
  eligibilityScore: number;
  matchReasons: string[];
  url: string;
}

/**
 * Grant proposal
 */
export interface GrantProposal {
  grantId: string;
  executiveSummary: string;
  problemStatement: string;
  solution: string;
  budget: Record<string, number>;
  impactMetrics: string[];
}

/**
 * Grant assessment output from Grant Navigator
 */
export interface GrantAssessment {
  grants: Grant[];
  proposals: GrantProposal[];
}

/**
 * Agent result stored in DynamoDB
 */
export interface AgentResult {
  userId: string;
  resultId: string;
  agentType: AgentType;
  createdAt: number;
  inputDocumentIds: string[];
  output: ExecutionPlan | GrantAssessment;
  tokensUsed: number;
  processingTimeMs: number;
  status: ProcessingStatus;
  errorMessage?: string;
}

/**
 * User profile
 */
export interface User {
  userId: string;
  email: string;
  organizationType: OrganizationType;
  createdAt: number;
  lastActiveAt: number;
  preferences: {
    language: Language;
    timezone: string;
    notificationEmail?: string;
  };
}

/**
 * Session for authentication
 */
export interface Session {
  sessionId: string;
  userId: string;
  apiKey: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
  ipAddress: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    requestId: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Free Tier usage tracking types
 */

/**
 * Token usage tracking
 */
export interface TokenUsage {
  sessionId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  currentUsage: number;
  dailyLimit: number;
  lastUpdated: number;
}

/**
 * Storage usage tracking
 */
export interface StorageUsage {
  sessionId: string;
  userId: string;
  currentUsage: number;
  maxUsage: number;
  lastUpdated: number;
}

/**
 * Rate limit tracking
 */
export interface RateLimitUsage {
  sessionId: string;
  userId: string;
  windowStart: number; // Unix timestamp
  requestCount: number;
  limit: number;
}

/**
 * Daily API request tracking
 */
export interface DailyUsage {
  sessionId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  apiRequests: number;
  dailyLimit: number;
  lastUpdated: number;
}

/**
 * Free Tier limits configuration
 */
export interface FreeTierLimits {
  tokenLimit: number; // 100,000 tokens/user/day
  storageCap: number; // 5GB per user
  rateLimit: number; // 100 requests/minute per user
  dailyLimit: number; // 1,000 API requests/user/day
}

/**
 * Usage alert for monitoring
 */
export interface UsageAlert {
  userId: string;
  alertType: 'token' | 'storage' | 'rate' | 'daily';
  currentUsage: number;
  limit: number;
  percentageUsed: number;
  timestamp: number;
}

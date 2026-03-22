export type EmailClassification =
  | 'client_request'
  | 'bug_report'
  | 'invoice'
  | 'grant_announcement'
  | 'grant_response'
  | 'partner_reply';

export interface ClassificationResult {
  classification: EmailClassification;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
}

export const PLAN_CLASSIFICATIONS: EmailClassification[] = [
  'client_request',
  'bug_report',
  'invoice',
  'partner_reply',
];

export const GRANT_CLASSIFICATIONS: EmailClassification[] = [
  'grant_announcement',
  'grant_response',
];

# Requirements Document: TLÁO Email Handling System

## Introduction

The TLÁO Email Handling System is the core input layer (Layer 1 — Intake) of the TLÁO Tactical Layer for Action & Outcomes platform. It ingests emails via AWS SES, classifies them using AI (Amazon Bedrock), converts them into operational signals, and triggers TLÁO agents (Plan or Grant) to produce execution artifacts. Email is not treated as communication — it is treated as execution infrastructure within the TLÁO execution graph.

The system supports a tiered model: Free tier users receive @tláo.com (xn--tlo-6ma.com) email addresses, while Pro tier users can bring custom domains. All emails flow through a unified Intake pipeline alongside manual uploads, connectors, and APIs, ultimately producing TLÁO Runs and Artifacts.

## Glossary

- **TLÁO_Email_System**: The email ingestion and mailbox subsystem serving as the Intake Layer
- **Intake_Layer**: Layer 1 of the TLÁO architecture responsible for receiving all operational inputs
- **Mailbox**: A named email address within a workspace that receives and stores emails
- **Workspace**: A project-level container that owns mailboxes, runs, and artifacts
- **MailMessage**: A parsed email record stored in DynamoDB with metadata and a reference to the raw email in S3
- **Intake_Processor**: The service that classifies incoming emails and routes them to the appropriate TLÁO agent
- **Email_Classification**: The AI-determined category of an email (e.g., client_request, bug_report, invoice, grant_announcement, grant_response, partner_reply)
- **TLÁO_Run**: An execution record created when an agent processes an intake signal
- **TLÁO_Artifact**: An output produced by a run (execution_plan, grant_draft, alert)
- **SES_Inbound**: AWS Simple Email Service configured to receive emails for verified domains
- **Email_Parser_Lambda**: The Lambda function that parses raw emails from S3 into structured MailMessage records
- **Raw_Email**: The original email stored as-is in S3 by SES inbound rules
- **Thread**: A group of related MailMessages linked by threadId
- **Tier_System**: The pricing model with Free (@tláo.com, limited) and Pro (custom domain, higher limits) tiers
- **Rate_Limiter**: The service that enforces per-workspace email processing rate limits

## Requirements

### Requirement 1: SES Inbound Email Reception

**User Story:** As a workspace owner, I want emails sent to my workspace mailbox addresses to be automatically received and stored, so that they enter the TLÁO execution pipeline without manual intervention.

#### Acceptance Criteria

1. WHEN an email is received by SES for a verified domain, THE SES_Inbound SHALL store the raw email in S3 under the path `incoming/{workspaceId}/{messageId}`
2. WHEN a raw email is stored in S3, THE SES_Inbound SHALL trigger the Email_Parser_Lambda via S3 event notification
3. IF an email exceeds 5MB in size, THEN THE SES_Inbound SHALL reject the email and log the rejection event
4. WHEN an email is received for a mailbox address that does not exist in any workspace, THE TLÁO_Email_System SHALL reject the email with a bounce response

### Requirement 2: Email Parsing and Storage

**User Story:** As a workspace member, I want incoming emails to be parsed into structured records, so that the system can classify and act on them.

#### Acceptance Criteria

1. WHEN the Email_Parser_Lambda is triggered, THE Email_Parser_Lambda SHALL extract sender address, subject, plain-text body, HTML body, and attachment metadata from the raw email
2. WHEN parsing is complete, THE Email_Parser_Lambda SHALL create a MailMessage record in DynamoDB with fields: workspaceId, mailbox, messageId, fromAddress, subject, bodyText, receivedAt, s3RawKey, threadId, and status set to "received"
3. WHEN the email contains In-Reply-To or References headers, THE Email_Parser_Lambda SHALL assign the MailMessage to an existing thread by matching threadId
4. IF the raw email cannot be parsed, THEN THE Email_Parser_Lambda SHALL set the MailMessage status to "parse_error" and log the error with the messageId and error details
5. WHEN a MailMessage is successfully created, THE Email_Parser_Lambda SHALL emit a NewMailMessageCreated event containing the workspaceId and messageId

### Requirement 3: Email Classification

**User Story:** As a workspace owner, I want incoming emails to be automatically classified by intent, so that the correct TLÁO agent is triggered without manual triage.

#### Acceptance Criteria

1. WHEN a NewMailMessageCreated event is received, THE Intake_Processor SHALL retrieve the MailMessage and invoke Amazon Bedrock to classify the email into one of the defined categories: client_request, bug_report, invoice, grant_announcement, grant_response, or partner_reply
2. WHEN classification is complete, THE Intake_Processor SHALL update the MailMessage record with the classification result and a confidence score between 0 and 1
3. IF the classification confidence score is below 0.6, THEN THE Intake_Processor SHALL set the MailMessage status to "needs_review" and skip automatic agent triggering
4. WHEN the email body exceeds 10,000 characters, THE Intake_Processor SHALL truncate the body to 10,000 characters before sending it to Bedrock for classification

### Requirement 4: TLÁO Agent Triggering

**User Story:** As a workspace owner, I want classified emails to automatically trigger the appropriate TLÁO agent, so that execution artifacts are produced without manual steps.

#### Acceptance Criteria

1. WHEN an email is classified as client_request, bug_report, invoice, or partner_reply, THE Intake_Processor SHALL create a TLÁO_Run record with agentType set to "PLAN" and source set to "EMAIL"
2. WHEN an email is classified as grant_announcement or grant_response, THE Intake_Processor SHALL create a TLÁO_Run record with agentType set to "GRANT" and source set to "EMAIL"
3. WHEN a TLÁO_Run is created, THE Intake_Processor SHALL invoke the corresponding TLÁO agent (TLÁO Plan or TLÁO Grant) with the MailMessage content as input
4. WHEN the agent completes execution, THE TLÁO_Email_System SHALL create a TLÁO_Artifact record with the artifact type (execution_plan, grant_draft, or alert), the S3 key of the artifact content, and a reference to the runId
5. WHEN a TLÁO_Run completes, THE TLÁO_Email_System SHALL update the MailMessage status to "processed" and link the runId to the MailMessage record

### Requirement 5: Mailbox Management

**User Story:** As a workspace owner, I want to create and manage mailboxes within my workspace, so that I can organize incoming emails by purpose.

#### Acceptance Criteria

1. WHEN a workspace owner creates a mailbox, THE TLÁO_Email_System SHALL validate that the workspace has fewer than 5 existing mailboxes
2. IF a workspace already has 5 mailboxes, THEN THE TLÁO_Email_System SHALL reject the creation request with an error indicating the maximum mailbox limit has been reached
3. WHEN a mailbox is created for a Free tier workspace, THE TLÁO_Email_System SHALL assign an address in the format `{mailbox-name}@xn--tlo-6ma.com`
4. WHEN a mailbox is created for a Pro tier workspace with a custom domain, THE TLÁO_Email_System SHALL assign an address using the workspace custom domain in the format `{mailbox-name}@{custom-domain}`
5. WHEN a mailbox is deleted, THE TLÁO_Email_System SHALL stop accepting new emails for that address and retain existing MailMessages for the TTL period

### Requirement 6: Tier-Based Limits and Safety Controls

**User Story:** As a platform operator, I want to enforce tier-based limits on email processing, so that the system stays within AWS Free Tier constraints and prevents abuse.

#### Acceptance Criteria

1. FOR ALL Free tier workspaces, THE TLÁO_Email_System SHALL enforce a maximum of 100 emails received per day per workspace
2. WHEN a Free tier workspace exceeds the daily email limit, THE TLÁO_Email_System SHALL reject additional incoming emails with a bounce response until the next calendar day
3. FOR ALL Free tier workspaces, THE TLÁO_Email_System SHALL apply a TTL of 60 days to MailMessage records in DynamoDB, automatically deleting expired records
4. WHEN processing an email, THE Rate_Limiter SHALL enforce a maximum of 10 email processing operations per minute per workspace
5. IF the per-workspace processing rate limit is exceeded, THEN THE Rate_Limiter SHALL queue the email for deferred processing and update the MailMessage status to "queued"

### Requirement 7: Data Model and Persistence

**User Story:** As a developer, I want a well-defined data model for email records, runs, and artifacts, so that the system maintains data integrity and supports querying.

#### Acceptance Criteria

1. THE TLÁO_Email_System SHALL store MailMessage records in a DynamoDB table with partition key workspaceId and sort key messageId
2. THE TLÁO_Email_System SHALL store TLÁO_Run records in a DynamoDB table with partition key workspaceId and sort key runId, including fields: agentType, source, sourceMessageId, status, createdAt, and completedAt
3. THE TLÁO_Email_System SHALL store TLÁO_Artifact records in a DynamoDB table with partition key runId and sort key artifactId, including fields: type, s3Key, and createdAt
4. WHEN a MailMessage record is serialized to DynamoDB and then deserialized, THE TLÁO_Email_System SHALL produce an equivalent MailMessage object (round-trip consistency)
5. WHEN a TLÁO_Run record is serialized to DynamoDB and then deserialized, THE TLÁO_Email_System SHALL produce an equivalent TLÁO_Run object (round-trip consistency)
6. WHEN a TLÁO_Artifact record is serialized to DynamoDB and then deserialized, THE TLÁO_Email_System SHALL produce an equivalent TLÁO_Artifact object (round-trip consistency)

### Requirement 8: Email Inbox UI API

**User Story:** As a workspace member, I want to view received emails, their classification, and linked runs inside the TLÁO UI, so that I can track how emails are being processed.

#### Acceptance Criteria

1. WHEN a user requests the inbox for a workspace, THE TLÁO_Email_System SHALL return a paginated list of MailMessages sorted by receivedAt in descending order
2. WHEN a user requests a specific MailMessage, THE TLÁO_Email_System SHALL return the full message details including classification, confidence score, linked runId, and linked artifacts
3. WHEN a user requests messages filtered by status (received, processing, processed, needs_review, parse_error), THE TLÁO_Email_System SHALL return only messages matching the specified status
4. WHEN a user requests messages for a specific mailbox within a workspace, THE TLÁO_Email_System SHALL return only messages addressed to that mailbox

### Requirement 9: Error Handling and Resilience

**User Story:** As a platform operator, I want the email processing pipeline to handle failures gracefully, so that no emails are lost and errors are recoverable.

#### Acceptance Criteria

1. IF the Email_Parser_Lambda fails during processing, THEN THE TLÁO_Email_System SHALL retain the raw email in S3 and set the MailMessage status to "parse_error" for later retry
2. IF the Intake_Processor fails during classification or agent triggering, THEN THE TLÁO_Email_System SHALL set the MailMessage status to "processing_error" and log the error with workspaceId, messageId, and error details
3. WHEN a Bedrock API call fails during classification, THE Intake_Processor SHALL retry with exponential backoff up to 3 attempts before marking the MailMessage as "processing_error"
4. IF a TLÁO agent fails during execution, THEN THE TLÁO_Email_System SHALL set the TLÁO_Run status to "error", store partial results if available, and update the MailMessage status to "processing_error"

### Requirement 10: Monitoring and Observability

**User Story:** As a platform operator, I want visibility into email processing metrics and errors, so that I can maintain service quality and diagnose issues.

#### Acceptance Criteria

1. FOR ALL email processing operations, THE TLÁO_Email_System SHALL log operation metadata (workspaceId, messageId, operation type, duration, status) to CloudWatch
2. WHEN an error occurs in any stage of the email pipeline, THE TLÁO_Email_System SHALL log the error with full context (workspaceId, messageId, stage, error message, stack trace) to CloudWatch
3. FOR ALL workspaces, THE TLÁO_Email_System SHALL track daily email volume metrics and expose them via a CloudWatch dashboard
4. WHEN a workspace reaches 80% of its daily email limit, THE TLÁO_Email_System SHALL emit a CloudWatch alarm

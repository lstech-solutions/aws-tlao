# Implementation Plan: TLÁO Email Handling System

## Overview

Implement the TLÁO Email Handling System as an extension of the existing `packages/backend/` TypeScript codebase. The implementation follows the SES → S3 → Lambda Parser → DynamoDB → Intake Processor → Agent pipeline, reusing existing services (DynamoDB, S3, Bedrock, rate limiter, agent orchestrator). Uses Jest + fast-check for testing.

## Tasks

- [ ] 1. Define email system types and data models
  - [ ] 1.1 Create email system type definitions
    - Create `packages/backend/src/models/email-types.ts`
    - Define interfaces: `MailMessage`, `Mailbox`, `TlaoRun`, `TlaoArtifact`, `ParsedEmail`, `AttachmentMetadata`, `EmailClassification`, `ClassificationResult`, `CostEntry`, `WorkspaceCostSummary`
    - Define type unions for status values, classification categories, agent types, artifact types
    - Extend existing `AgentType` in `types.ts` or keep email-specific types separate
    - _Requirements: 7.1, 7.2, 7.3, 2.2, 4.1, 4.2, 4.4_

  - [ ]\* 1.2 Write property test for data model serialization round-trip
    - **Property 19: Data model serialization round-trip**
    - Generate random MailMessage, TlaoRun, and TlaoArtifact objects using fast-check arbitraries
    - Serialize to DynamoDB format and deserialize back, verify equivalence
    - **Validates: Requirements 7.4, 7.5, 7.6**

  - [ ] 1.3 Create DynamoDB table schemas for email system
    - Add table schemas to `packages/backend/src/services/table-schemas.ts` or create `packages/backend/src/services/email-table-schemas.ts`
    - Define MailMessages table (PK: workspaceId, SK: messageId) with GSIs: ReceivedAtIndex, MailboxIndex, StatusIndex
    - Define Mailboxes table (PK: workspaceId, SK: mailboxId) with GSI: EmailAddressIndex
    - Define Runs table (PK: workspaceId, SK: runId) with GSI: SourceIndex
    - Define Artifacts table (PK: runId, SK: artifactId)
    - Define CostTracking table (PK: workspaceId, SK: date#service#operation)
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 2. Implement mailbox management service
  - [ ] 2.1 Create mailbox service
    - Create `packages/backend/src/services/mailbox-service.ts`
    - Implement `createMailbox()`: validate mailbox count < 5, generate email address based on tier (free: `{name}@xn--tlo-6ma.com`, pro: `{name}@{customDomain}`)
    - Implement `deleteMailbox()`: mark as inactive, stop accepting new emails
    - Implement `listMailboxes()`: return active mailboxes for workspace
    - Implement `resolveMailbox()`: look up mailbox by email address using EmailAddressIndex GSI
    - Use existing `dynamoDBService` for all DynamoDB operations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 1.4_

  - [ ]\* 2.2 Write property tests for mailbox service
    - **Property 11: Mailbox count limit enforcement**
    - **Property 12: Email address generation by tier**
    - **Property 13: Deleted mailbox rejection**
    - **Property 14: Mailbox resolution for unknown addresses**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 1.4**

  - [ ]\* 2.3 Write unit tests for mailbox service
    - Test creating mailbox on Free tier with correct address format
    - Test creating mailbox on Pro tier with custom domain
    - Test rejection when 5 mailboxes already exist
    - Test delete and verify inactive status
    - Test resolveMailbox returns null for unknown address
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Implement email parser Lambda
  - [ ] 3.1 Create email parser handler
    - Create `packages/backend/src/api/email-parser.ts`
    - Implement S3 event handler that extracts workspaceId and messageId from S3 key
    - Download raw email from S3 using existing `s3Service`
    - Parse raw email: extract fromAddress, toAddress, subject, bodyText, bodyHtml, attachments metadata, In-Reply-To, References headers
    - Resolve threadId from In-Reply-To/References headers by querying existing MailMessages
    - Resolve mailbox → workspace mapping using `mailboxService.resolveMailbox()`
    - Create MailMessage record in DynamoDB with status "received"
    - Emit NewMailMessageCreated event (direct Lambda invocation or SNS publish)
    - Handle parse errors: set status to "parse_error", retain raw email in S3
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]\* 3.2 Write property tests for email parser
    - **Property 1: Email parsing round-trip**
    - **Property 2: MailMessage record completeness**
    - **Property 3: Thread assignment from headers**
    - **Property 4: NewMailMessageCreated event correctness**
    - **Property 22: S3 key path format**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 1.1**

  - [ ]\* 3.3 Write unit tests for email parser
    - Test parsing a well-formed email with all headers
    - Test parsing email with missing optional headers
    - Test parsing email with attachments
    - Test handling malformed email (parse_error status)
    - Test S3 key extraction for workspaceId and messageId
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement intake processor and classification
  - [ ] 5.1 Create intake processor service
    - Create `packages/backend/src/services/intake-processor.ts`
    - Implement `processNewEmail()`: retrieve MailMessage, check rate limits, classify, route to agent
    - Implement `classifyEmail()`: truncate body to 10,000 chars, construct classification prompt, invoke Bedrock using existing `bedrockService`, parse JSON response
    - Implement classification-to-agent routing: PLAN for {client_request, bug_report, invoice, partner_reply}, GRANT for {grant_announcement, grant_response}
    - Handle low confidence (< 0.6): set status to "needs_review", skip agent triggering
    - Handle Bedrock failures: retry with exponential backoff (3 attempts), set "processing_error" on failure
    - Update MailMessage with classification result and confidence score
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

  - [ ]\* 5.2 Write property tests for intake processor
    - **Property 5: Classification result validity**
    - **Property 6: Low-confidence classification routing**
    - **Property 7: Body truncation for classification**
    - **Property 8: Classification-to-agent-type mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.1, 4.2**

  - [ ]\* 5.3 Write unit tests for intake processor
    - Test classifying a sample client request email
    - Test classifying a sample grant announcement email
    - Test low-confidence classification sets "needs_review"
    - Test Bedrock retry on failure
    - Test body truncation for long emails
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Implement run and artifact creation
  - [ ] 6.1 Create run and artifact services
    - Create `packages/backend/src/services/run-service.ts`
    - Implement `createRun()`: create TlaoRun record in DynamoDB with agentType, source "EMAIL", sourceMessageId, status "pending"
    - Implement `completeRun()`: update status to "completed", set completedAt, update linked MailMessage status to "processed" and set linkedRunId
    - Implement `failRun()`: update status to "error", store error message, update MailMessage to "processing_error"
    - Create `packages/backend/src/services/artifact-service.ts`
    - Implement `createArtifact()`: store artifact content in S3, create TlaoArtifact record in DynamoDB
    - Implement `getArtifactsByRun()`: query artifacts by runId
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]\* 6.2 Write property tests for run and artifact services
    - **Property 9: Run completion updates MailMessage**
    - **Property 10: Artifact creation on run completion**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]\* 6.3 Write unit tests for run and artifact services
    - Test creating a PLAN run from email classification
    - Test creating a GRANT run from email classification
    - Test run completion updates MailMessage status
    - Test artifact creation stores in S3 and DynamoDB
    - Test run failure sets error status
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 7. Implement rate limiting and tier controls
  - [ ] 7.1 Create email rate limiter and tier enforcement
    - Create `packages/backend/src/services/email-rate-limiter.ts` (or extend existing `rate-limiter.ts`)
    - Implement daily email counter per workspace: track count in DynamoDB, reject at 100/day for Free tier
    - Implement processing rate limiter: max 10 operations/minute per workspace, queue excess with status "queued"
    - Implement TTL calculation for Free tier: set TTL to receivedAt + 60 days
    - Implement email size validation: reject emails > 5MB
    - Integrate with existing `rateLimiterService` patterns
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 1.3_

  - [ ]\* 7.2 Write property tests for rate limiting and tier controls
    - **Property 15: Email size validation**
    - **Property 16: Daily email limit enforcement**
    - **Property 17: Free tier TTL calculation**
    - **Property 18: Processing rate limit enforcement**
    - **Validates: Requirements 1.3, 6.1, 6.2, 6.3, 6.4, 6.5**

  - [ ]\* 7.3 Write unit tests for rate limiting
    - Test accepting emails under daily limit
    - Test rejecting emails over daily limit
    - Test TTL is set to 60 days from creation
    - Test processing rate limit queues excess
    - Test email size validation at 5MB boundary
    - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement inbox API handlers
  - [ ] 9.1 Create inbox API handler
    - Create `packages/backend/src/api/inbox-handler.ts`
    - Implement `GET /workspaces/{workspaceId}/inbox`: paginated list of MailMessages sorted by receivedAt descending, using ReceivedAtIndex GSI
    - Implement `GET /workspaces/{workspaceId}/inbox/{messageId}`: single message with classification, linked runId, linked artifacts
    - Implement status filter: query using StatusIndex GSI
    - Implement mailbox filter: query using MailboxIndex GSI
    - Implement `POST /workspaces/{workspaceId}/mailboxes`: create mailbox (delegates to mailbox service)
    - Implement `DELETE /workspaces/{workspaceId}/mailboxes/{mailboxId}`: delete mailbox
    - Implement `GET /workspaces/{workspaceId}/mailboxes`: list mailboxes
    - Follow existing API response format from `agent-handler.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]\* 9.2 Write property tests for inbox API
    - **Property 20: Inbox query sort order**
    - **Property 21: Inbox query filter correctness**
    - **Validates: Requirements 8.1, 8.3, 8.4**

  - [ ]\* 9.3 Write unit tests for inbox API
    - Test paginated inbox query returns correct page
    - Test status filter returns only matching messages
    - Test mailbox filter returns only matching messages
    - Test single message retrieval includes linked data
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Implement cost tracker service
  - [ ] 10.1 Create cost tracker service
    - Create `packages/backend/src/services/cost-tracker.ts`
    - Implement `trackOperation()`: record cost entry in DynamoDB CostTracking table
    - Implement `getWorkspaceCost()`: aggregate monthly costs by service
    - Implement `getWorkspaceDailyCost()`: return daily cost entries
    - Apply cost estimation rules from design (SES, Bedrock, S3, Lambda, DynamoDB rates)
    - Integrate cost tracking calls into email parser, intake processor, and artifact service
    - _Requirements: Cost Analysis section_

  - [ ]\* 10.2 Write unit tests for cost tracker
    - Test tracking a Bedrock classification operation
    - Test monthly cost aggregation
    - Test daily cost breakdown
    - _Requirements: Cost Analysis section_

- [ ] 11. Wire pipeline end-to-end and integrate monitoring
  - [ ] 11.1 Wire the complete email processing pipeline
    - Connect Email Parser Lambda → Intake Processor → Agent Orchestrator → Artifact Service
    - Ensure Email Parser calls `intakeProcessor.processNewEmail()` after creating MailMessage
    - Ensure Intake Processor calls `runService.createRun()` and invokes agent via existing `agentOrchestratorService`
    - Ensure agent completion calls `artifactService.createArtifact()` and `runService.completeRun()`
    - Ensure rate limiter checks are called before processing
    - Ensure cost tracker is called at each stage
    - Add CloudWatch logging at each pipeline stage using existing `logger`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2_

  - [ ] 11.2 Add monitoring and alarm thresholds
    - Implement daily volume tracking: increment counter per workspace per day
    - Implement 80% threshold alarm: emit CloudWatch alarm when daily count reaches 80% of limit
    - Add error logging with full context (workspaceId, messageId, stage, error) at each pipeline stage
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]\* 11.3 Write property tests for volume tracking
    - **Property 23: Daily volume tracking accuracy**
    - **Property 24: Usage alarm threshold**
    - **Validates: Requirements 10.3, 10.4**

- [ ] 12. Export new modules and update index
  - [ ] 12.1 Update package exports
    - Update `packages/backend/src/index.ts` to export new services: mailboxService, intakeProcessor, runService, artifactService, costTracker, emailRateLimiter
    - Update `packages/backend/src/index.ts` to export new API handlers: emailParser, inboxHandler
    - Export new types from `email-types.ts`
    - _Requirements: All_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation reuses existing services from `packages/backend/` (dynamoDBService, s3Service, bedrockService, rateLimiterService, agentOrchestratorService, logger)
- CloudFormation template for SES inbound rules already exists at `infrastructure/cloudformation/email-forwarding.yaml` and will need to be updated for the new pipeline

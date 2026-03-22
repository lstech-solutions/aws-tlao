# Implementation Plan: TLÁO Email Handling System

## Overview

Implement the TLÁO Email Handling System as a standalone package at `packages/email/` with its own package.json, dependencies, and deployment pipeline. The implementation follows the Stalwart → JMAP Ingestion → Email Parser Lambda → DynamoDB → Intake Processor → Backend API → Agent pipeline. The email package communicates with the TLÁO backend via REST API calls, not direct imports. Uses Jest + fast-check for testing.

## Tasks

- [ ] 1. Set up email package structure and dependencies
  - [x] 1.1 Create email package directory and configuration
    - Create `packages/email/` directory
    - Create `packages/email/package.json` with dependencies: aws-sdk, mailparser, uuid, node-fetch
    - Create `packages/email/tsconfig.json` extending monorepo base config
    - Create `packages/email/jest.config.js` for testing
    - Add email package to workspace in root `package.json`
    - _Requirements: All (infrastructure)_

  - [x] 1.2 Create email system type definitions
    - Create `packages/email/src/types/mail-message.ts`
    - Define interfaces: `MailMessage`, `ParsedEmail`, `AttachmentMetadata`
    - Create `packages/email/src/types/mailbox.ts`
    - Define interfaces: `Mailbox`, `ProvisioningResult`
    - Create `packages/email/src/types/classification.ts`
    - Define types: `EmailClassification`, `ClassificationResult`
    - Create `packages/email/src/types/run.ts`
    - Define interfaces: `EmailRun`, `EmailArtifact`, `AgentExecutionRequest`, `AgentExecutionResponse`
    - Define type unions for status values, classification categories, agent types
    - _Requirements: 6.4, 6.5, 7.1, 7.2, 4.5_

  - [ ]* 1.3 Write property test for data model serialization round-trip
    - **Property 19: Data model serialization round-trip**
    - Create `packages/email/tests/property/data-model.property.test.ts`
    - Generate random MailMessage, EmailRun, and EmailArtifact objects using fast-check arbitraries
    - Serialize to DynamoDB format and deserialize back, verify equivalence
    - **Validates: Requirements 17.6**

  - [x] 1.4 Create DynamoDB table schemas and S3 bucket
    - Create `packages/email/infrastructure/email-stack.ts` CDK stack
    - Define tlao-email-messages table (PK: workspaceId, SK: messageId) with GSIs: ReceivedAtIndex, MailboxIndex, StatusIndex
    - Define tlao-email-mailboxes table (PK: workspaceId, SK: mailboxId) with GSIs: EmailAddressIndex, DomainIndex
    - Define tlao-email-runs table (PK: workspaceId, SK: runId) with GSIs: SourceIndex, BackendRunIndex
    - Define tlao-email-artifacts table (PK: runId, SK: artifactId)
    - Define tlao-email-cost-tracking table (PK: workspaceId, SK: date#service#operation)
    - Create S3 bucket: tlao-email-{accountId} with folders: raw/, artifacts/, backups/
    - _Requirements: 6.4, 7.1, 8.1_

- [x] 2. Implement Stalwart client and mailbox provisioning
  - [x] 2.1 Create Stalwart management API client
    - Create `packages/email/src/services/stalwart-client.ts`
    - Implement `createPrincipal()`: call Stalwart management API to create user account with email, name, password
    - Implement `deletePrincipal()`: delete Stalwart user account
    - Implement `createAlias()`: create email alias forwarding to target mailbox(es)
    - Implement `deleteAlias()`: remove email alias
    - Implement `getMailboxInfo()`: retrieve mailbox quota and message count
    - Use Stalwart API key from environment variable for authentication
    - _Requirements: 4.2, 4.3, 4.8, 14.1, 14.2, 14.4_

  - [x] 2.2 Create mailbox service with Stalwart provisioning
    - Create `packages/email/src/services/mailbox-service.ts`
    - Create `packages/email/src/lib/dynamodb.ts` wrapper for DynamoDB operations
    - Implement `createMailbox()`: validate workspace, generate mailboxId, create Mailbox record in tlao-email-mailboxes
    - Implement `provisionMailbox()`: call stalwartClient.createPrincipal(), configure DNS records, return credentials
    - Implement `deleteMailbox()`: mark as inactive, call stalwartClient.deletePrincipal()
    - Implement `listMailboxes()`: query tlao-email-mailboxes by workspaceId
    - Implement `resolveMailbox()`: look up mailbox by email address using EmailAddressIndex GSI
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 13.3_

  - [ ]* 2.3 Write property tests for mailbox service
    - **Property 12: Stalwart principal creation**
    - **Property 15: Mailbox resolution for unknown addresses**
    - Create `packages/email/tests/property/mailbox.property.test.ts`
    - **Validates: Requirements 4.2, 4.3, 4.1**

  - [ ]* 2.4 Write unit tests for mailbox service
    - Create `packages/email/tests/unit/mailbox-service.test.ts`
    - Test creating mailbox with operational ingestion mode
    - Test provisioning mailbox creates Stalwart principal
    - Test delete mailbox marks inactive
    - Test resolveMailbox returns null for unknown address
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Implement email client support (autodiscover/autoconfig)
  - [x] 3.1 Update ProvisioningResult to include connection details
    - Modify `packages/email/src/services/mailbox-service.ts`
    - Update `ProvisioningResult` interface to include credentials object with: username, password, imapServer, imapPort, imapSecurity, smtpServer, smtpPort, smtpSecurity
    - Update `provisionMailbox()` to return connection details: IMAP (port 993 with TLS), SMTP (port 465 with TLS)
    - _Requirements: 18.6_

  - [x] 3.2 Implement autodiscover endpoint for Microsoft Outlook
    - Create `packages/email/src/api/autodiscover-handler.ts`
    - Implement `POST /autodiscover/autodiscover.xml`: parse Autodiscover XML request, resolve mailbox, return XML with IMAP (server, port 993, SSL on) and SMTP (server, port 465, SSL on) configurations
    - Handle unknown email addresses with 404 response
    - _Requirements: 18.7, 18.9_

  - [x] 3.3 Implement autoconfig endpoint for Mozilla Thunderbird
    - Extend `packages/email/src/api/autodiscover-handler.ts`
    - Implement `GET /mail/config-v1.1.xml?emailaddress={email}`: resolve mailbox, return XML with incomingServer (type=imap, port=993, socketType=SSL) and outgoingServer (type=smtp, port=465, socketType=SSL)
    - Implement `GET /.well-known/autoconfig/mail/config-v1.1.xml?emailaddress={email}`: alternative path for autoconfig
    - Handle unknown email addresses with 404 response
    - _Requirements: 18.8, 18.10_

  - [x] 3.4 Configure Stalwart for IMAP/SMTP ports
    - Update `packages/email/infrastructure/email-stack.ts`
    - Document Stalwart configuration in `/etc/stalwart/config.toml`: IMAP port 143 (STARTTLS), IMAPS port 993 (TLS), SMTP port 587 (STARTTLS), SMTPS port 465 (TLS), SMTP port 25 (server-to-server)
    - Configure TLS certificates for secure connections
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 3.5 Update security group configuration for email client ports
    - Update `packages/email/infrastructure/email-stack.ts`
    - Add inbound rules: port 143 (IMAP), port 993 (IMAPS), port 587 (SMTP submission), port 465 (SMTPS)
    - Ensure port 25 (SMTP) is already configured for incoming mail
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 3.6 Write property tests for autodiscover/autoconfig XML validity
    - **Property 26: Autodiscover XML format validity**
    - **Property 27: Autoconfig XML format validity**
    - Create `packages/email/tests/property/autodiscover.property.test.ts`
    - Generate random email addresses with valid mailboxes, verify autodiscover XML structure (IMAP port 993, SMTP port 465, SSL on)
    - Generate random email addresses with valid mailboxes, verify autoconfig XML structure (incomingServer type=imap port=993 socketType=SSL, outgoingServer type=smtp port=465 socketType=SSL)
    - **Validates: Requirements 18.7, 18.8, 18.9, 18.10**

  - [ ]* 3.7 Write property tests for connection details completeness
    - **Property 25: Provisioning result connection details completeness**
    - Create `packages/email/tests/property/provisioning.property.test.ts`
    - Generate random mailbox provisioning requests, verify all connection details present (username, password, imapServer, imapPort, imapSecurity, smtpServer, smtpPort, smtpSecurity)
    - Verify IMAP port is 993 or 143, SMTP port is 465 or 587
    - Verify security settings are TLS or STARTTLS
    - **Validates: Requirements 18.6**

  - [ ]* 3.8 Write unit tests for email client connectivity
    - Create `packages/email/tests/unit/email-client.test.ts`
    - Test autodiscover XML generation for valid mailbox
    - Test autoconfig XML generation for valid mailbox
    - Test autodiscover returns 404 for unknown email address
    - Test autoconfig returns 404 for unknown email address
    - Test alternative autoconfig path (/.well-known/autoconfig/mail/config-v1.1.xml)
    - Test provisioning result includes all connection details
    - _Requirements: 18.6, 18.7, 18.8, 18.9, 18.10_

- [x] 4. Implement JMAP ingestion service
  - [x] 4.1 Create JMAP client for Stalwart
    - Create `packages/email/src/services/jmap-ingestion.ts`
    - Implement `connect()`: establish JMAP connection to Stalwart using URL and API key from environment
    - Implement `pollForNewEmails()`: query Stalwart mailbox for new emails via JMAP protocol
    - Implement `getEmailContent()`: fetch raw email content by emailId
    - Implement `markAsProcessed()`: add processed flag or move to processed folder
    - Poll interval: 30 seconds (configurable via environment variable)
    - _Requirements: 6.1, 6.2, 6.3, 1.9_

  - [ ]* 4.2 Write property tests for JMAP ingestion
    - **Property 16: JMAP ingestion detection latency**
    - Create `packages/email/tests/property/jmap-ingestion.property.test.ts`
    - **Validates: Requirements 6.3**

  - [ ]* 4.3 Write unit tests for JMAP ingestion
    - Create `packages/email/tests/unit/jmap-ingestion.test.ts`
    - Test connecting to Stalwart via JMAP
    - Test polling for new emails
    - Test fetching email content
    - Test marking email as processed
    - Test handling JMAP connection failures
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement email parser Lambda
  - [x] 6.1 Create email parser handler
    - Create `packages/email/src/lambdas/email-parser.ts`
    - Create `packages/email/src/lib/s3.ts` wrapper for S3 operations
    - Implement Lambda handler: receive event with emailId, mailboxId, workspaceId from JMAP Ingestion
    - Fetch raw email content from Stalwart via JMAP (not S3)
    - Parse using mailparser library: extract fromAddress, toAddress, subject, bodyText, bodyHtml, attachments metadata
    - Extract threading headers: In-Reply-To, References
    - Resolve threadId by querying tlao-email-messages for matching messageId in References/In-Reply-To
    - Store raw email copy in S3 at `raw/{workspaceId}/{messageId}`
    - Create MailMessage record in tlao-email-messages with status "received"
    - Emit NewMailMessageCreated event to trigger Intake Processor
    - Handle parse errors: set status to "parse_error", retain raw email in S3
    - _Requirements: 6.4, 6.5, 6.7_

  - [ ]* 6.2 Write property tests for email parser
    - **Property 1: Email parsing round-trip**
    - **Property 2: MailMessage record completeness**
    - **Property 3: Thread assignment from headers**
    - **Property 4: NewMailMessageCreated event correctness**
    - **Property 22: S3 key path format**
    - Create `packages/email/tests/property/email-parser.property.test.ts`
    - **Validates: Requirements 6.4, 6.5, 6.7**

  - [ ]* 6.3 Write unit tests for email parser
    - Create `packages/email/tests/unit/email-parser.test.ts`
    - Test parsing a well-formed email with all headers
    - Test parsing email with missing optional headers
    - Test parsing email with attachments
    - Test handling malformed email (parse_error status)
    - Test threading logic with In-Reply-To header
    - _Requirements: 6.4, 6.5, 6.7_

- [x] 7. Implement intake processor and classification
  - [x] 7.1 Create Bedrock client for classification
    - Create `packages/email/src/services/bedrock-client.ts`
    - Implement `classifyEmail()`: invoke Bedrock with classification prompt, parse JSON response
    - Return ClassificationResult with classification, confidence, reasoning
    - Handle Bedrock API failures with exponential backoff retry (3 attempts)
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Create intake processor service
    - Create `packages/email/src/services/intake-processor.ts`
    - Create `packages/email/src/lib/rate-limiter.ts` for rate limiting logic
    - Implement `processNewEmail()`: retrieve MailMessage from DynamoDB, check rate limits, classify, route to agent
    - Implement body truncation: limit to 10,000 characters before sending to Bedrock
    - Implement classification-to-agent routing: PLAN for {client_request, bug_report, invoice, partner_reply}, GRANT for {grant_announcement, grant_response}
    - Handle low confidence (< 0.6): set status to "needs_review", skip agent triggering
    - Update MailMessage with classification result and confidence score
    - Create EmailRun record in tlao-email-runs with agentType, source "EMAIL", sourceMessageId
    - Call Backend API to execute agent (POST /api/agents/execute)
    - Store returned artifacts in S3 and tlao-email-artifacts table
    - Update MailMessage status to "processed" and set linkedRunId
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2_

  - [ ]* 7.3 Write property tests for intake processor
    - **Property 5: Classification result validity**
    - **Property 6: Low-confidence classification routing**
    - **Property 7: Body truncation for classification**
    - **Property 8: Classification-to-agent-type mapping**
    - **Property 23: Backend API integration correctness**
    - Create `packages/email/tests/property/intake-processor.property.test.ts`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [ ]* 7.4 Write unit tests for intake processor
    - Create `packages/email/tests/unit/intake-processor.test.ts`
    - Test classifying a sample client request email
    - Test classifying a sample grant announcement email
    - Test low-confidence classification sets "needs_review"
    - Test Bedrock retry on failure
    - Test body truncation for long emails
    - Test Backend API call with correct parameters
    - Test artifact storage after agent execution
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8. Implement run and artifact services
  - [x] 8.1 Create run and artifact services
    - Create `packages/email/src/services/run-service.ts`
    - Implement `createRun()`: create EmailRun record in tlao-email-runs with agentType, source "EMAIL", sourceMessageId, status "pending"
    - Implement `completeRun()`: update status to "completed", set completedAt, update linked MailMessage status to "processed" and set linkedRunId
    - Implement `failRun()`: update status to "error", store error message, update MailMessage to "processing_error"
    - Create `packages/email/src/services/artifact-service.ts`
    - Implement `createArtifact()`: store artifact content in S3 at `artifacts/{runId}/{artifactId}.json`, create EmailArtifact record in tlao-email-artifacts
    - Implement `getArtifactsByRun()`: query tlao-email-artifacts by runId
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [ ]* 8.2 Write property tests for run and artifact services
    - **Property 9: Run completion updates MailMessage**
    - **Property 10: Artifact creation on run completion**
    - Create `packages/email/tests/property/run-artifact.property.test.ts`
    - **Validates: Requirements 7.5, 7.6, 7.7**

  - [ ]* 8.3 Write unit tests for run and artifact services
    - Create `packages/email/tests/unit/run-service.test.ts`
    - Test creating a PLAN run from email classification
    - Test creating a GRANT run from email classification
    - Test run completion updates MailMessage status
    - Test artifact creation stores in S3 and DynamoDB
    - Test run failure sets error status
    - _Requirements: 7.4, 7.5, 7.6_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement inbox and mailbox API handlers
  - [x] 10.1 Create inbox API handler
    - Create `packages/email/src/api/inbox-handler.ts`
    - Implement `GET /api/email/workspaces/{workspaceId}/inbox`: paginated list of MailMessages sorted by receivedAt descending, using ReceivedAtIndex GSI
    - Implement `GET /api/email/workspaces/{workspaceId}/inbox/{messageId}`: single message with classification, linked runId, linked artifacts
    - Implement `GET /api/email/workspaces/{workspaceId}/inbox?status={status}`: filter by status using StatusIndex GSI
    - Implement `GET /api/email/workspaces/{workspaceId}/inbox?mailbox={mailboxId}`: filter by mailbox using MailboxIndex GSI
    - Return consistent API response format with success, data, metadata fields
    - _Requirements: 6.4, 7.1, 7.5_

  - [x] 10.2 Create mailbox API handler
    - Create `packages/email/src/api/mailbox-handler.ts`
    - Implement `POST /api/email/workspaces/{workspaceId}/mailboxes`: create mailbox (delegates to mailbox service)
    - Implement `DELETE /api/email/workspaces/{workspaceId}/mailboxes/{mailboxId}`: delete mailbox
    - Implement `GET /api/email/workspaces/{workspaceId}/mailboxes`: list mailboxes
    - Implement `GET /api/email/workspaces/{workspaceId}/mailboxes/{mailboxId}`: get mailbox details
    - _Requirements: 4.1, 4.4, 13.3_

  - [ ]* 10.3 Write property tests for inbox API
    - **Property 20: Inbox query sort order**
    - **Property 21: Inbox query filter correctness**
    - Create `packages/email/tests/property/inbox-api.property.test.ts`
    - **Validates: Requirements 6.4**

  - [ ]* 10.4 Write unit tests for inbox and mailbox APIs
    - Create `packages/email/tests/unit/inbox-handler.test.ts`
    - Test paginated inbox query returns correct page
    - Test status filter returns only matching messages
    - Test mailbox filter returns only matching messages
    - Test single message retrieval includes linked data
    - Create `packages/email/tests/unit/mailbox-handler.test.ts`
    - Test creating mailbox via API
    - Test listing mailboxes
    - Test deleting mailbox
    - _Requirements: 4.1, 4.4, 6.4_

- [x] 11. Implement DNS configuration and alias management
  - [x] 11.1 Create DNS configuration service
    - Create `packages/email/src/services/dns-config.ts`
    - Implement `configureDNS()`: create MX, SPF, DKIM, DMARC records in Route 53 for domain
    - Implement `validateDNSPropagation()`: verify DNS records are propagated before marking provisioning complete
    - Implement reverse DNS (PTR) configuration for Elastic IP
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 13.2_

  - [x] 11.2 Implement alias management
    - Extend `packages/email/src/services/stalwart-client.ts` with alias operations
    - Implement `updateAlias()`: modify alias target mailboxes
    - Implement alias validation: verify target mailboxes exist before creating alias
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 11.3 Write property tests for DNS and alias management
    - **Property 13: DNS configuration completeness**
    - **Property 14: Alias forwarding correctness**
    - Create `packages/email/tests/property/dns-alias.property.test.ts`
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 14.1, 14.2**

  - [ ]* 11.4 Write unit tests for DNS and alias management
    - Create `packages/email/tests/unit/dns-config.test.ts`
    - Test creating MX record
    - Test creating SPF, DKIM, DMARC records
    - Test validating DNS propagation
    - Test handling Route 53 failures
    - Create `packages/email/tests/unit/alias-management.test.ts`
    - Test creating alias with multiple targets
    - Test updating alias targets
    - Test deleting alias
    - Test alias validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 14.1, 14.2, 14.3, 14.4_

- [x] 12. Implement cost tracker service
  - [x] 12.1 Create cost tracker service
    - Create `packages/email/src/services/cost-tracker.ts`
    - Implement `trackOperation()`: record cost entry in tlao-email-cost-tracking table
    - Implement `getWorkspaceCost()`: aggregate monthly costs by service
    - Implement `getWorkspaceDailyCost()`: return daily cost entries
    - Apply cost estimation rules: Bedrock ($0.002/classification, $0.01/agent), S3 ($0.000005/PUT, $0.023/GB/mo), DynamoDB ($0.00000125/WCU, $0.00000025/RCU), EC2 shared cost ($0.38/workspace at 100 workspaces)
    - Integrate cost tracking calls into email parser, intake processor, and artifact service
    - _Requirements: Cost Analysis section_

  - [ ]* 12.2 Write unit tests for cost tracker
    - Create `packages/email/tests/unit/cost-tracker.test.ts`
    - Test tracking a Bedrock classification operation
    - Test monthly cost aggregation
    - Test daily cost breakdown
    - _Requirements: Cost Analysis section_

- [x] 13. Wire pipeline end-to-end and integrate monitoring
  - [x] 13.1 Wire the complete email processing pipeline
    - Connect JMAP Ingestion → Email Parser Lambda → Intake Processor → Backend API → Artifact Service
    - Ensure JMAP Ingestion triggers Email Parser Lambda when new email detected
    - Ensure Email Parser calls intakeProcessor.processNewEmail() after creating MailMessage
    - Ensure Intake Processor calls Backend API (POST /api/agents/execute) with correct parameters
    - Ensure agent completion calls artifactService.createArtifact() and runService.completeRun()
    - Ensure rate limiter checks are called before processing
    - Ensure cost tracker is called at each stage
    - Add CloudWatch logging at each pipeline stage
    - _Requirements: 6.1, 6.3, 6.4, 7.1, 7.4, 7.5, 7.6_

  - [x] 13.2 Add monitoring and error handling
    - Implement error handling for JMAP connection failures: retry with exponential backoff
    - Implement error handling for Bedrock API failures: retry 3 times, set "processing_error" on failure
    - Implement error handling for Backend API failures: retry once, set EmailRun status to "error"
    - Implement error handling for S3 failures: retry put operations
    - Add CloudWatch alarms for disk usage (>80%), authentication failure rate, mail delivery failure rate
    - Log all errors with full context (workspaceId, messageId, stage, error)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ]* 13.3 Write integration tests for end-to-end pipeline
    - Create `packages/email/tests/integration/pipeline.integration.test.ts`
    - Test end-to-end flow: JMAP ingestion → parsing → classification → agent execution → artifact storage
    - Test error handling at each stage
    - Test rate limiting enforcement
    - _Requirements: 6.1, 6.3, 6.4, 7.1, 7.4, 7.5_

- [-] 14. Implement personal email opt-in and privacy controls
  - [x] 14.1 Create personal email privacy service
    - Create `packages/email/src/services/privacy-service.ts`
    - Implement `checkOptIn()`: verify user has opted in for personal mailbox ingestion
    - Implement `setOptIn()`: allow user to opt in or revoke opt-in
    - Implement privacy controls: limit data extraction for personal emails (no body content analysis, only metadata)
    - Integrate with intake processor: skip processing if user has not opted in
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 14.2 Write property tests for privacy controls
    - **Property 17: Personal email opt-in enforcement**
    - Create `packages/email/tests/property/privacy.property.test.ts`
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 14.3 Write unit tests for privacy service
    - Create `packages/email/tests/unit/privacy-service.test.ts`
    - Test personal mailbox without opt-in is not processed
    - Test personal mailbox with opt-in is processed with privacy controls
    - Test user can revoke opt-in
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 15. Implement outcome and artifact mapping
  - [x] 15.1 Create outcome linking service
    - Create `packages/email/src/services/outcome-linking.ts`
    - Implement `analyzeContentForOutcomes()`: parse email content for outcome references (keywords, IDs, patterns)
    - Implement `linkEmailToOutcomes()`: create links between MailMessage and outcomes
    - Implement `analyzeContentForArtifacts()`: identify artifact generation opportunities
    - Implement `createArtifactProposal()`: create artifact proposal for user review
    - Store routing rules in DynamoDB: map email patterns to outcomes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 15.2 Write property tests for outcome linking
    - **Property 18: Outcome linking from content**
    - Create `packages/email/tests/property/outcome-linking.property.test.ts`
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 15.3 Write unit tests for outcome linking
    - Create `packages/email/tests/unit/outcome-linking.test.ts`
    - Test analyzing email content for outcome references
    - Test creating links between email and outcomes
    - Test artifact proposal generation
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 16. Export package modules and create index
  - [x] 16.1 Create package exports
    - Create `packages/email/src/index.ts`
    - Export all services: jmapIngestion, emailParser, intakeProcessor, mailboxService, stalwartClient, bedrockClient, runService, artifactService, costTracker, privacyService, outcomeLinking
    - Export all API handlers: inboxHandler, mailboxHandler, autodiscoverHandler
    - Export all types from types/ directory
    - Export utility functions from lib/ directory
    - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The email package is standalone at `packages/email/` with its own dependencies and deployment
- Email package communicates with backend via REST API calls (POST /api/agents/execute), not direct imports
- All file paths reference `packages/email/src/` not `packages/backend/src/`
- Email package uses its own DynamoDB tables prefixed with `tlao-email-`
- JMAP ingestion from Stalwart replaces SES → S3 pattern
- Stalwart client manages mailbox provisioning via management API
- Independent deployment and testing from backend package

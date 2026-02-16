# Implementation Plan: TLÁO Autonomous Agent Platform

## Overview

This implementation plan breaks down the TLÁO platform into discrete, incremental tasks. Each task builds on previous work, with property-based tests integrated throughout to validate correctness properties. The platform will be built using TypeScript/Node.js, AWS Lambda, Bedrock, DynamoDB, and S3.

The implementation follows a layered approach:
1. Core infrastructure and types
2. Data layer (DynamoDB, S3)
3. Document ingestion pipeline
4. Agent orchestration and execution
5. API endpoints
6. Free Tier enforcement
7. Integration and testing

## Tasks

- [x] 1. Set up project structure, dependencies, and core types
  - [x] Initialize TypeScript Node.js project with AWS SDK v3
  - [x] Install dependencies: aws-sdk, @aws-sdk/client-bedrock-runtime, @aws-sdk/client-dynamodb, @aws-sdk/client-s3, jest, fast-check, dotenv
  - [x] Create directory structure: src/{api, agents, services, models, utils, deployment}, tests/
  - [x] Define core TypeScript interfaces and types:
    - [x] Agent interface (process, validate)
    - [x] Document types (DocumentMetadata, ProcessedDocument)
    - [x] Result types (ExecutionPlan, GrantAssessment)
    - [x] API response types (ApiResponse, ErrorResponse)
    - [x] Usage tracking types (TokenUsage, StorageUsage, RateLimit)
  - [x] Set up environment configuration (AWS region, Bedrock model ID, DynamoDB table names)
  - [x] Create deployment configuration for demo and BYOA scenarios
  - [x] _Requirements: 11.1, 11.2, 11.3, 9.1, 5.1_

- [x] 2. Implement DynamoDB data layer
  - [x] 2.1 Create DynamoDB client wrapper with CRUD operations
    - [x] Initialize DynamoDB DocumentClient
    - [x] Implement generic put, get, query, scan operations
    - [x] Add error handling and retry logic
    - [x] _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 2.2 Write property test for data persistence round trip
    - **Property 4: Data Persistence Round Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Generate random result objects, store in DynamoDB, retrieve, verify equivalence

  - [x] 2.3 Create DynamoDB table schemas and initialization
    - [x] Define Users, Documents, Results, Sessions tables
    - [x] Create table initialization script (create tables if not exist)
    - [x] Add indexes for userId, agentType, createdAt queries
    - [x] _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.4 Implement user and session management
    - [x] Create User model with CRUD operations
    - [x] Create Session model with token generation and validation
    - [x] Implement API key hashing and verification
    - [x] _Requirements: 15.1, 15.2_

- [x] 3. Implement S3 document storage layer
  - [x] 3.1 Create S3 client wrapper with upload/download operations
    - [x] Initialize S3 client
    - [x] Implement upload with encryption
    - [x] Implement download with streaming
    - [x] Add error handling for missing files
    - [x] _Requirements: 12.1, 12.3_

  - [ ]* 3.2 Write property test for document ingestion round trip
    - **Property 1: Document Ingestion Round Trip**
    - **Validates: Requirements 12.1, 12.2, 12.3**
    - Generate random documents, upload to S3, retrieve, verify text content equivalence

  - [x] 3.3 Implement document metadata storage
    - [x] Create Document model with DynamoDB operations
    - [x] Store document metadata (type, size, upload time, s3Path)
    - [x] Implement document retrieval by userId and documentId
    - [x] _Requirements: 12.1, 12.3_

- [x] 4. Implement document ingestion pipeline
  - [x] 4.1 Create document validation and parsing
    - [x] Validate file format (email, pdf, audio, text, markdown)
    - [x] Validate file size (max 50MB)
    - [x] Implement format-specific parsers:
      - [x] Email: Parse .eml files (extract headers, body)
      - [x] PDF: Extract text (use pdf-parse library)
      - [x] Text/Markdown: Direct ingestion
      - [x] Audio: Prepare for Transcribe (validate format)
    - [x] _Requirements: 12.1, 12.5_

  - [x] 4.2 Create AWS Transcribe integration
    - [x] Implement audio transcription using Amazon Transcribe
    - [x] Handle async transcription (start job, poll for completion)
    - [x] Store transcript in S3
    - [x] Handle transcription errors gracefully
    - [x] _Requirements: 12.2_

  - [x] 4.3 Create Document Ingestion Lambda handler
    - [x] Accept multipart/form-data file upload
    - [x] Validate authentication
    - [x] Call document parser
    - [x] Call Transcribe if audio
    - [x] Store document and metadata
    - [x] Return documentId and status
    - [x] _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ]* 4.4 Write unit tests for document ingestion
    - Test valid file uploads (PDF, email, text, audio)
    - Test invalid file format rejection
    - Test file size validation
    - Test text extraction accuracy
    - _Requirements: 12.1, 12.5_

- [x] 5. Implement Bedrock integration
  - [x] 5.1 Create Bedrock client wrapper
    - [x] Initialize Bedrock runtime client
    - [x] Implement invoke model with error handling
    - [x] Implement retry logic with exponential backoff (max 3 attempts)
    - [x] Track token usage for monitoring
    - [x] _Requirements: 2.1, 3.1, 14.2_

  - [x] 5.2 Create prompt templates for agents
    - [x] Implement TLÁO Plan prompt template
    - [x] Implement TLÁO Grant prompt template
    - [x] Add prompt validation and sanitization
    - [x] _Requirements: 2.1, 3.1_

  - [x] 5.3 Implement response parsing and validation
    - [x] Parse JSON responses from Bedrock
    - [x] Validate response schema (execution plan, grants, proposals)
    - [x] Handle malformed responses with fallback
    - [x] _Requirements: 2.2, 3.3_

- [x] 6. Implement TLÁO Plan agent
  - [x] 6.1 Create TLÁO Plan agent class
    - [x] Implement Agent interface
    - [x] Retrieve user documents from DynamoDB and S3
    - [x] Construct prompt with document content
    - [x] Invoke Bedrock with TLÁO Plan prompt
    - [x] Parse and validate execution plan response
    - [x] Store result in DynamoDB
    - [x] _Requirements: 2.1, 2.2, 2.3, 7.1_

  - [ ]* 6.2 Write property test for execution plan consistency
    - **Property 2: Execution Plan Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Generate random operational inputs, invoke agent, verify plan structure validity (valid priorities, deadlines within 7 days, no circular dependencies)

  - [ ]* 6.3 Write unit tests for TLÁO Plan
    - Test execution plan generation with sample inputs
    - Test alert generation for blocked tasks
    - Test metrics calculation
    - Test error handling for invalid inputs
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Implement TLÁO Grant agent
  - [x] 7.1 Create TLÁO Grant agent class
    - [x] Implement Agent interface
    - [x] Retrieve user organization profile from DynamoDB
    - [x] Load grants database (mock or external source)
    - [x] Construct prompt with organization context and grants
    - [x] Invoke Bedrock with TLÁO Grant prompt
    - [x] Parse and validate grants and proposals response
    - [x] Store result in DynamoDB
    - [x] _Requirements: 3.1, 3.2, 3.3, 7.1_

  - [x] 7.2 Implement multilingual support
    - [x] Add language parameter to agent invocation
    - [x] Modify prompt to request output in specified language
    - [x] Validate language support (en, es, pt)
    - [x] _Requirements: 4.4_

  - [ ]* 7.3 Write property test for grant eligibility monotonicity
    - **Property 3: Grant Eligibility Monotonicity**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random organization profiles, invoke agent, verify eligibility scores are consistent with criteria

  - [ ]* 7.4 Write property test for multilingual support consistency
    - **Property 8: Multilingual Support Consistency**
    - **Validates: Requirements 4.4**
    - Generate requests in multiple languages, verify response language and semantic equivalence

  - [ ]* 7.5 Write unit tests for TLÁO Grant
    - Test grant matching with sample organization profiles
    - Test eligibility scoring
    - Test proposal generation
    - Test multilingual output
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Implement API Gateway and HTTP handlers
  - [x] 8.1 Create API Gateway integration
    - [x] Set up API Gateway REST API
    - [x] Configure CORS
    - [x] Set up request/response models
    - [x] _Requirements: 13.1_

  - [x] 8.2 Implement authentication middleware
    - [x] Create Builder ID validation function
    - [x] Create JWT token validation (optional)
    - [x] Implement session lookup and validation
    - [x] Return 401/403 for invalid credentials
    - [x] _Requirements: 13.2, 15.1, 15.2_

  - [x] 8.3 Implement document upload endpoint
    - [x] Create POST /documents/upload handler
    - [x] Validate authentication
    - [x] Call Document Ingestion Lambda
    - [x] Return documentId and status
    - [x] _Requirements: 12.1, 13.1, 13.2_

  - [x] 8.4 Implement agent invocation endpoint
    - [x] Create POST /agents/{agentType}/invoke handler
    - [x] Validate authentication
    - [x] Validate agentType (tlao-plan, tlao-grant)
    - [x] Call Agent Orchestrator Lambda
    - [x] Return result with metadata
    - [x] _Requirements: 11.2, 13.1, 13.2, 13.3_

  - [x] 8.5 Implement history retrieval endpoint
    - [x] Create GET /history/{userId} handler
    - [x] Validate authentication
    - [x] Implement pagination (limit, offset)
    - [x] Return results ordered by createdAt
    - [x] _Requirements: 13.1, 13.4, 7.2_

  - [x] 8.6 Implement result retrieval endpoint
    - [x] Create GET /results/{resultId} handler
    - [x] Validate authentication and ownership
    - [x] Return full result with output
    - [x] _Requirements: 13.1, 13.2_

  - [ ]* 8.7 Write property test for API response schema validity
    - **Property 5: API Response Schema Validity**
    - **Validates: Requirements 13.1, 13.3**
    - Generate random valid requests, invoke endpoints, verify response schema compliance

  - [ ]* 8.8 Write property test for authentication enforcement
    - **Property 6: Authentication Enforcement**
    - **Validates: Requirements 13.2, 15.1, 15.2**
    - Generate requests with missing/invalid credentials, verify rejection with correct status codes

  - [ ]* 8.9 Write unit tests for API endpoints
    - Test successful document upload
    - Test successful agent invocation
    - Test successful history retrieval with pagination
    - Test authentication failures
    - Test invalid input validation
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 9. Implement Free Tier enforcement
  - [x] 9.1 Create rate limiter service
    - [x] Implement rate limiting at 100 requests/minute per user
    - [x] Track request counts in DynamoDB
    - [x] Return 429 with retry-after header when exceeded
    - [x] _Requirements: 4.5, 4.6_

  - [x] 9.2 Create token tracker service
    - [x] Track token usage against daily limits (100,000 tokens/user/day)
    - [x] Update usage in DynamoDB on each request
    - [x] Reject requests when limit exceeded with 429 status
    - [x] _Requirements: 4.1, 4.2_

  - [x] 9.3 Create storage tracker service
    - [x] Track storage usage per user (5GB cap)
    - [x] Update usage in DynamoDB on each upload
    - [x] Reject uploads when limit exceeded with 413 status
    - [x] _Requirements: 4.3, 4.4_

  - [ ] 9.4 Implement Free Tier monitoring
    - Emit CloudWatch metrics for usage tracking
    - Set alarms at 80% of limits
    - Generate daily usage reports
    - _Requirements: 8.3, 8.4_

  - [ ] 9.5 Implement daily cap enforcement
    - Track daily API requests (1,000 per user/day)
    - Update usage in DynamoDB
    - Reject requests when limit exceeded with 429 status
    - _Requirements: 4.6_

- [x] 10. Implement error handling and resilience
  - [x] 10.1 Create error handling utilities
    - [x] Define error types (ValidationError, AuthError, ServiceError, etc.)
    - [x] Implement error response formatting
    - [x] Implement error logging to CloudWatch
    - [x] _Requirements: 14.1, 14.4_

  - [x] 10.2 Implement retry logic for external services
    - [x] Implement exponential backoff for Bedrock calls (max 3 attempts)
    - [x] Implement exponential backoff for DynamoDB operations
    - [x] Implement timeout handling for Lambda (60 seconds for agent processing)
    - [x] _Requirements: 14.2, 14.3_

  - [ ]* 10.3 Write property test for error handling graceful degradation
    - **Property 7: Error Handling Graceful Degradation**
    - **Validates: Requirements 14.1, 14.4**
    - Generate invalid inputs, verify error messages and state consistency

  - [ ]* 10.4 Write unit tests for error handling
    - Test error response formatting
    - Test retry logic
    - Test timeout handling
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 11. Implement monitoring and observability
  - [x] 11.1 Create CloudWatch logging
    - [x] Implement structured logging for all Lambda functions
    - [x] Log request/response metadata
    - [x] Log errors with context
    - [x] _Requirements: 8.1, 8.2_

  - [ ] 11.2 Create CloudWatch metrics
    - Emit metrics for processing time
    - Emit metrics for success/error rates
    - Emit metrics for token usage
    - Emit metrics for Lambda invocations
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 11.3 Write unit tests for monitoring
    - Test metric emission
    - Test log formatting
    - _Requirements: 8.1, 8.2_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify passing
  - Run all property-based tests and verify passing
  - Check code coverage (target 80% for core logic)
  - Ask the user if questions arise

- [ ] 13. Implement infrastructure as code
  - [ ] 13.1 Create Terraform/CloudFormation templates
    - Define API Gateway REST API
    - Define Lambda functions with environment variables
    - Define DynamoDB tables with indexes
    - Define S3 bucket with encryption and lifecycle policies
    - Define IAM roles and policies (least-privilege, no root credentials)
    - Define CloudWatch log groups
    - _Requirements: 11.1, 11.3, 7.1, 7.3, 15.3, 15.4, 5.2_

  - [ ] 13.2 Create BYOA deployment templates
    - Create CloudFormation/CDK templates for self-hosted deployment
    - Include connection instructions for Builder ID integration
    - Implement least-privilege IAM roles
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 13.3 Create demo deployment script
    - Implement deployment script that completes in under 5 minutes
    - Include pre-configured demo scenario setup
    - Generate demo URL after deployment
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 13.4 Create deployment script
    - Build TypeScript to JavaScript
    - Package Lambda functions
    - Deploy infrastructure
    - Run smoke tests
    - _Requirements: 11.1_

- [ ] 14. Integration and wiring
  - [ ] 14.1 Wire all components together
    - Connect API Gateway to Lambda handlers
    - Connect Lambda handlers to agents
    - Connect agents to Bedrock
    - Connect all services to DynamoDB and S3
    - Test end-to-end flow
    - _Requirements: 11.1, 11.2, 11.3, 2.1, 3.1, 13.1_

  - [ ]* 14.2 Write integration tests
    - Test end-to-end document upload → agent processing → result retrieval
    - Test TLÁO Plan workflow
    - Test TLÁO Grant workflow
    - Test error scenarios
    - _Requirements: 11.1, 11.2, 11.3, 2.1, 3.1, 13.1_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Run all unit tests, property tests, and integration tests
  - Verify code coverage
  - Verify AWS Free Tier compliance (token usage, API calls, storage)
  - Ask the user if questions arise

- [ ] 16. Documentation and deployment
  - [ ] 16.1 Create API documentation
    - Document all endpoints with examples
    - Document error codes and responses
    - Create OpenAPI/Swagger specification
    - _Requirements: 13.5_

  - [ ] 16.2 Create deployment guide
    - Document setup steps
    - Document environment variables
    - Document AWS Free Tier considerations
    - Document BYOA deployment process
    - Document demo deployment process
    - _Requirements: 11.1, 5.1, 5.3, 5.4, 9.1_

  - [ ] 16.3 Deploy to AWS
    - Deploy infrastructure
    - Deploy Lambda functions
    - Run smoke tests
    - Verify all endpoints are working
    - _Requirements: 11.1, 11.2, 11.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests are integrated throughout to catch bugs early
- Checkpoints ensure incremental validation
- All code should follow TypeScript best practices and include JSDoc comments
- AWS Free Tier compliance is critical—monitor token usage and API calls throughout

## Testing Summary

### Unit Tests
- Document ingestion (format validation, parsing, storage)
- Agent logic (execution plan generation, grant matching)
- API endpoints (authentication, validation, response formatting)
- Error handling (retry logic, timeout handling)
- Monitoring (metric emission, logging)

### Property-Based Tests
1. **Property 1: Document Ingestion Round Trip** - Validates Requirements 12.1, 12.2, 12.3
2. **Property 2: Execution Plan Consistency** - Validates Requirements 2.1, 2.2, 2.3
3. **Property 3: Grant Eligibility Monotonicity** - Validates Requirements 3.1, 3.2
4. **Property 4: Data Persistence Round Trip** - Validates Requirements 7.1, 7.2, 7.3
5. **Property 5: API Response Schema Validity** - Validates Requirements 13.1, 13.3
6. **Property 6: Authentication Enforcement** - Validates Requirements 13.2, 15.1, 15.2
7. **Property 7: Error Handling Graceful Degradation** - Validates Requirements 14.1, 14.4
8. **Property 8: Multilingual Support Consistency** - Validates Requirements 4.4

### Test Framework
- **Unit tests**: Jest
- **Property-based tests**: fast-check
- **Minimum iterations**: 100 per property test
- **Coverage target**: 80% for core logic, 60% overall

# Design Document: AI Agent Platform

## Overview

The AI Agent Platform is a serverless, event-driven system built on AWS that orchestrates specialized AI agents to process diverse inputs and generate structured outputs. The platform uses Amazon Bedrock for AI reasoning, AWS Lambda for orchestration, DynamoDB for state management, and S3 for document storage.

The architecture is designed to be:
- **Modular**: Each agent is a self-contained workflow that implements a common interface
- **Scalable**: Serverless components auto-scale to handle concurrent requests
- **Cost-efficient**: Optimized for AWS Free Tier with careful monitoring of token usage and API calls
- **Extensible**: New agents can be added without modifying core infrastructure

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  (Web UI, Mobile App, CLI, Third-party Integrations)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (REST)                            │
│  - Authentication (API Key / AWS IAM)                           │
│  - Request validation                                            │
│  - Response formatting                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Document   │  │    Agent     │  │   History    │
│  Ingestion   │  │ Orchestrator │  │  Retrieval   │
│   Lambda     │  │   Lambda     │  │   Lambda     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Services Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Bedrock    │  │  Transcribe  │  │  CloudWatch  │          │
│  │  (Claude)    │  │  (Audio→Text)│  │  (Logging)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  DynamoDB    │  │      S3      │  │     KMS      │          │
│  │  (State)     │  │  (Documents) │  │ (Encryption) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client** sends request to API Gateway with document or agent invocation
2. **API Gateway** validates authentication and routes to appropriate Lambda
3. **Document Ingestion Lambda** (if applicable):
   - Validates file format and size
   - Transcribes audio using Transcribe
   - Extracts text and stores in S3
   - Records metadata in DynamoDB
4. **Agent Orchestrator Lambda**:
   - Retrieves user context and previous documents from DynamoDB
   - Constructs prompt for Bedrock
   - Invokes Bedrock with appropriate model
   - Parses and validates response
   - Stores results in DynamoDB
5. **Response** returned to client with structured output

## Components and Interfaces

### 1. API Gateway

**Responsibility**: HTTP request routing, authentication, response formatting

**Endpoints**:
- `POST /documents/upload` - Upload document for processing
- `POST /agents/{agentType}/invoke` - Invoke an agent (ops-copilot, grant-navigator)
- `GET /history/{userId}` - Retrieve execution history
- `GET /results/{resultId}` - Retrieve specific result
- `GET /health` - Health check

**Authentication**: API Key (header: `X-API-Key`) or AWS SigV4

**Response Format**:
```json
{
  "success": true,
  "data": { /* agent-specific output */ },
  "metadata": {
    "requestId": "uuid",
    "timestamp": "ISO-8601",
    "processingTimeMs": 1234
  }
}
```

### 2. Document Ingestion Lambda

**Responsibility**: Accept, validate, and process documents in multiple formats

**Inputs**:
- File (multipart/form-data)
- User ID
- Document type (email, pdf, audio, text, markdown)

**Processing**:
1. Validate file size (max 50MB)
2. Validate MIME type
3. Extract text:
   - Email: Parse headers and body
   - PDF: Extract text using textract or similar
   - Audio: Transcribe using Amazon Transcribe
   - Text/Markdown: Direct ingestion
4. Store raw file in S3 with path: `s3://bucket/documents/{userId}/{documentId}/{filename}`
5. Store metadata in DynamoDB:
   - documentId (UUID)
   - userId
   - uploadTime
   - documentType
   - textContent (first 5000 chars for indexing)
   - s3Path
   - transcriptPath (if audio)

**Outputs**:
```json
{
  "documentId": "uuid",
  "status": "processed",
  "textLength": 5000,
  "s3Path": "s3://bucket/documents/..."
}
```

### 3. Agent Orchestrator Lambda

**Responsibility**: Coordinate agent execution, Bedrock invocation, and result storage

**Inputs**:
- agentType (ops-copilot, grant-navigator)
- userId
- documentIds (array of document IDs to process)
- agentConfig (optional parameters)

**Processing**:
1. Retrieve user profile from DynamoDB
2. Retrieve documents from S3 and DynamoDB
3. Construct agent-specific prompt
4. Invoke Bedrock with:
   - Model: Claude 3 Sonnet (or Titan for cost optimization)
   - Max tokens: 2000
   - Temperature: 0.7
5. Parse response JSON
6. Validate response schema
7. Store result in DynamoDB:
   - resultId (UUID)
   - userId
   - agentType
   - inputDocumentIds
   - output (structured JSON)
   - createdAt
   - tokensUsed
8. Return result to client

**Outputs** (agent-specific):
- Ops Copilot: `{ executionPlan: [...], alerts: [...], metrics: {...} }`
- Grant Navigator: `{ grants: [...], proposals: [...] }`

### 4. Agent Implementations

#### Ops Copilot Agent

**Prompt Template**:
```
You are an AI operations assistant for solo founders. Analyze the following operational inputs and generate a structured weekly execution plan.

Inputs:
{documents}

Generate a JSON response with:
{
  "executionPlan": [
    {
      "taskId": "string",
      "title": "string",
      "priority": "high|medium|low",
      "owner": "string",
      "deadline": "YYYY-MM-DD",
      "estimatedHours": number,
      "dependencies": ["taskId"]
    }
  ],
  "alerts": [
    {
      "severity": "critical|warning|info",
      "message": "string",
      "affectedTasks": ["taskId"]
    }
  ],
  "metrics": {
    "totalTasks": number,
    "highPriorityCount": number,
    "blockedCount": number,
    "estimatedWeeklyHours": number
  }
}
```

**Validation**:
- All tasks have unique taskIds
- Deadlines are within 7 days
- Priority values are valid
- Dependencies reference existing tasks

#### Grant Navigator Agent

**Prompt Template**:
```
You are an AI grant discovery and proposal assistant. Analyze the organization profile and generate grant matches and proposal drafts.

Organization Profile:
{organizationData}

Available Grants Database:
{grantsDatabase}

Generate a JSON response with:
{
  "grants": [
    {
      "grantId": "string",
      "name": "string",
      "funder": "string",
      "amount": number,
      "deadline": "YYYY-MM-DD",
      "eligibilityScore": 0-100,
      "matchReasons": ["string"],
      "url": "string"
    }
  ],
  "proposals": [
    {
      "grantId": "string",
      "executiveSummary": "string",
      "problemStatement": "string",
      "solution": "string",
      "budget": { /* budget breakdown */ },
      "impactMetrics": ["string"]
    }
  ]
}
```

**Validation**:
- Eligibility scores are 0-100
- All proposals reference valid grants
- Budget totals are reasonable
- URLs are valid

### 5. History Retrieval Lambda

**Responsibility**: Query and return user execution history

**Inputs**:
- userId
- agentType (optional filter)
- limit (default 20, max 100)
- offset (for pagination)

**Processing**:
1. Query DynamoDB for results matching userId and optional agentType
2. Sort by createdAt descending
3. Apply pagination
4. Return results with metadata

**Outputs**:
```json
{
  "results": [
    {
      "resultId": "uuid",
      "agentType": "ops-copilot",
      "createdAt": "ISO-8601",
      "summary": "string",
      "tokensUsed": number
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

## Data Models

### DynamoDB Tables

#### 1. Users Table
```
PK: userId (String)
SK: (none)

Attributes:
- userId: String (UUID)
- email: String
- organizationType: String (founder, ngo, startup)
- createdAt: Number (Unix timestamp)
- lastActiveAt: Number
- preferences: Map
  - language: String (en, es, pt)
  - timezone: String
  - notificationEmail: String
```

#### 2. Documents Table
```
PK: userId (String)
SK: documentId (String)

Attributes:
- userId: String
- documentId: String (UUID)
- uploadTime: Number (Unix timestamp)
- documentType: String (email, pdf, audio, text, markdown)
- fileName: String
- fileSize: Number (bytes)
- s3Path: String
- transcriptPath: String (if audio)
- textContent: String (first 5000 chars)
- metadata: Map
  - source: String (email, upload, etc.)
  - sender: String (if email)
  - subject: String (if email)
```

#### 3. Results Table
```
PK: userId (String)
SK: resultId (String)

Attributes:
- userId: String
- resultId: String (UUID)
- agentType: String (ops-copilot, grant-navigator)
- createdAt: Number (Unix timestamp)
- inputDocumentIds: List<String>
- output: Map (agent-specific structured output)
- tokensUsed: Number
- processingTimeMs: Number
- status: String (success, error)
- errorMessage: String (if status=error)
```

#### 4. Sessions Table
```
PK: sessionId (String)
SK: (none)

Attributes:
- sessionId: String (UUID)
- userId: String
- apiKey: String (hashed)
- createdAt: Number
- expiresAt: Number
- lastUsedAt: Number
- ipAddress: String
```

### S3 Bucket Structure
```
s3://ai-agent-platform-{accountId}/
├── documents/
│   ├── {userId}/
│   │   ├── {documentId}/
│   │   │   ├── original.{ext}
│   │   │   ├── transcript.txt (if audio)
│   │   │   └── metadata.json
├── results/
│   ├── {userId}/
│   │   ├── {resultId}.json
├── logs/
│   ├── {date}/
│   │   ├── {timestamp}-{requestId}.log
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Document Ingestion Round Trip

**For any** valid document uploaded to the system, retrieving the document from S3 and comparing its text content to the original should produce equivalent text (allowing for minor formatting differences).

**Validates: Requirements 2.1, 2.2, 2.3**

**Rationale**: Ensures that documents are correctly stored and retrievable without data loss or corruption.

### Property 2: Execution Plan Consistency

**For any** set of operational inputs processed by Ops Copilot, the generated execution plan should have all tasks with valid priorities, all deadlines within 7 days, and no circular dependencies.

**Validates: Requirements 3.1, 3.2, 3.3**

**Rationale**: Ensures the agent produces structurally valid execution plans that can be reliably used by founders.

### Property 3: Grant Eligibility Monotonicity

**For any** grant in the Grant Navigator results, if an organization meets a grant's eligibility criteria, the eligibility score should be greater than 0, and if it doesn't meet criteria, the score should be 0.

**Validates: Requirements 4.1, 4.2**

**Rationale**: Ensures eligibility scoring is logically consistent with stated criteria.

### Property 4: Data Persistence Round Trip

**For any** result stored in DynamoDB, retrieving it by resultId should return the exact same data (including all nested structures and metadata).

**Validates: Requirements 6.1, 6.2, 6.3**

**Rationale**: Ensures data integrity and that users can reliably retrieve their work.

### Property 5: API Response Schema Validity

**For any** successful API response, the response should conform to the documented JSON schema with required fields present and correct types.

**Validates: Requirements 5.1, 5.3**

**Rationale**: Ensures API clients can reliably parse responses without unexpected field variations.

### Property 6: Authentication Enforcement

**For any** API request without valid authentication credentials, the system should reject the request with a 401 or 403 status code and not process the request.

**Validates: Requirements 5.2, 9.1, 9.2**

**Rationale**: Ensures unauthorized access is prevented and user data is protected.

### Property 7: Error Handling Graceful Degradation

**For any** invalid input provided to the system, the system should return a descriptive error message and maintain consistent state (no partial updates or corrupted data).

**Validates: Requirements 7.1, 7.4**

**Rationale**: Ensures the system is resilient and users understand what went wrong.

### Property 8: Multilingual Support Consistency

**For any** request to Grant Navigator in a supported language (English, Spanish, Portuguese), the response should be in the requested language and maintain semantic equivalence.

**Validates: Requirements 4.4**

**Rationale**: Ensures the system reliably serves multilingual users without language mixing or loss of meaning.

## Error Handling

### Error Categories and Responses

#### 1. Authentication Errors (401, 403)
- Missing API key: `{ "error": "Missing authentication credentials", "code": "AUTH_MISSING" }`
- Invalid API key: `{ "error": "Invalid API key", "code": "AUTH_INVALID" }`
- Expired session: `{ "error": "Session expired", "code": "AUTH_EXPIRED" }`

#### 2. Validation Errors (400)
- Invalid file format: `{ "error": "File format not supported: .docx", "code": "INVALID_FORMAT" }`
- File too large: `{ "error": "File exceeds 50MB limit", "code": "FILE_TOO_LARGE" }`
- Missing required field: `{ "error": "Missing required field: agentType", "code": "MISSING_FIELD" }`

#### 3. Resource Errors (404)
- Document not found: `{ "error": "Document not found", "code": "NOT_FOUND" }`
- Result not found: `{ "error": "Result not found", "code": "NOT_FOUND" }`

#### 4. Rate Limit Errors (429)
- Too many requests: `{ "error": "Rate limit exceeded. Retry after 60 seconds", "code": "RATE_LIMIT" }`

#### 5. Server Errors (500)
- Bedrock API failure: `{ "error": "AI service temporarily unavailable. Please retry.", "code": "SERVICE_ERROR" }`
- Database error: `{ "error": "Database error. Please retry.", "code": "DB_ERROR" }`

### Retry Strategy
- Client-side: Exponential backoff (1s, 2s, 4s, 8s) for 429 and 5xx errors
- Server-side: Lambda retries Bedrock calls up to 3 times with exponential backoff

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

1. **Document Ingestion Tests**:
   - Valid file upload (PDF, email, audio, text)
   - Invalid file format rejection
   - File size validation
   - Text extraction accuracy

2. **Agent Logic Tests**:
   - Execution plan generation with sample inputs
   - Grant eligibility scoring with known data
   - Error handling for malformed Bedrock responses

3. **Data Model Tests**:
   - DynamoDB item creation and retrieval
   - S3 document storage and retrieval
   - Data validation (required fields, types)

4. **API Tests**:
   - Authentication validation
   - Request/response schema validation
   - Error response formatting
   - Pagination logic

### Property-Based Testing

Property-based tests verify universal properties across many generated inputs:

1. **Property 1: Document Ingestion Round Trip**
   - Generate random documents in supported formats
   - Upload and retrieve
   - Verify text content equivalence

2. **Property 2: Execution Plan Consistency**
   - Generate random operational inputs
   - Invoke Ops Copilot agent
   - Verify plan structure validity

3. **Property 3: Grant Eligibility Monotonicity**
   - Generate random organization profiles
   - Invoke Grant Navigator
   - Verify eligibility scores match criteria

4. **Property 4: Data Persistence Round Trip**
   - Generate random results
   - Store in DynamoDB
   - Retrieve and verify equivalence

5. **Property 5: API Response Schema Validity**
   - Generate random valid requests
   - Invoke API endpoints
   - Verify response schema compliance

6. **Property 6: Authentication Enforcement**
   - Generate requests with missing/invalid credentials
   - Verify rejection with correct status codes

7. **Property 7: Error Handling Graceful Degradation**
   - Generate invalid inputs
   - Verify error messages and state consistency

8. **Property 8: Multilingual Support Consistency**
   - Generate requests in multiple languages
   - Verify response language and semantic equivalence

### Test Configuration

- **Minimum iterations**: 100 per property test
- **Test framework**: Jest (for Node.js/TypeScript)
- **Property testing library**: fast-check
- **Coverage target**: 80% for core logic, 60% overall

### Testing Approach

- **Unit tests** focus on specific examples and edge cases
- **Property tests** focus on universal properties and comprehensive input coverage
- Both are complementary and necessary for comprehensive coverage
- Property tests catch subtle bugs that unit tests might miss
- Unit tests provide fast feedback during development

## Implementation Notes

### AWS Free Tier Considerations

1. **Bedrock**: Monitor token usage; Claude 3 Sonnet is cost-effective
2. **Lambda**: 1M free invocations/month; optimize cold start time
3. **DynamoDB**: 25GB free storage; use on-demand billing for variable load
4. **S3**: 5GB free storage; implement document retention policies
5. **Transcribe**: ~$0.0001 per second; cache transcripts to avoid re-processing

### Cost Optimization Strategies

1. Use Lambda layers for shared dependencies
2. Implement document caching to avoid re-processing
3. Batch Bedrock calls where possible
4. Use DynamoDB TTL for automatic cleanup of old results
5. Monitor CloudWatch metrics to stay within Free Tier

### Security Best Practices

1. Store API keys in AWS Secrets Manager
2. Use IAM roles for Lambda execution
3. Enable S3 bucket encryption with KMS
4. Enable VPC endpoints for private connectivity
5. Implement request signing for API calls

## Deployment Architecture

### Infrastructure as Code (Terraform/CloudFormation)

- API Gateway with REST API
- Lambda functions (Document Ingestion, Agent Orchestrator, History Retrieval)
- DynamoDB tables with appropriate indexes
- S3 bucket with lifecycle policies
- IAM roles and policies
- CloudWatch log groups
- KMS keys for encryption

### CI/CD Pipeline

- GitHub Actions for automated testing
- Automated deployment to AWS on merge to main
- Staging environment for testing
- Production environment for live traffic

## Future Enhancements

1. **Additional Agents**: Email summarization, code review assistant, etc.
2. **Webhooks**: Real-time notifications for completed tasks
3. **Integrations**: Slack, Notion, Jira, GitHub API
4. **Advanced Analytics**: Dashboard for tracking productivity trends
5. **Fine-tuning**: Custom models trained on user data for better results

# Implementation Plan: TLÁO Codex

## Overview

Incremental implementation of the TLÁO Codex agent orchestration control plane. Each phase builds on the previous, starting with shared types and DynamoDB access, then the orchestrator, API, CLI, SDK, and finally the web UI. TypeScript throughout, using `fast-check` for property-based tests.

## Tasks

- [ ] 1. Set up package structure and shared core types
  - [ ] 1.1 Create `packages/codex-core` package with package.json, tsconfig.json
    - Add to pnpm workspace
    - Configure TypeScript with strict mode
    - Add dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `uuid`
    - Add dev dependencies: `fast-check`, `jest`, `ts-jest`, `@types/jest`
    - _Requirements: 6.1-6.7_

  - [ ] 1.2 Define core entity types and TaskSpec interface
    - Create `src/models/types.ts` with: TaskSpec, Workspace, Task, Run, RunStatus, Artifact, ArtifactType, ExecutorRegistryEntry, ProgressEvent, GuardrailConfig
    - Create `src/models/index.ts` barrel export
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1_

  - [ ] 1.3 Implement DynamoDB entity serialization (toItem/fromItem) for all entity types
    - Create `src/models/serialization.ts` with toItem/fromItem for Workspace, Task, Run, RunStep, Artifact, ExecutorRegistryEntry
    - Compute PK/SK from entity fields per single-table design
    - _Requirements: 6.1-6.7_

  - [ ]\* 1.4 Write property tests for entity serialization round-trip and key format
    - **Property 3: Entity serialization round-trip**
    - **Validates: Requirements 6.7**
    - **Property 4: Entity key format correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [ ] 1.5 Implement TaskSpec validation
    - Create `src/validation/task-spec.ts` with validateTaskSpec() function
    - Validate taskType against registered types, required fields (input.prompt), constraint bounds
    - Return structured validation errors identifying specific violations
    - _Requirements: 1.2, 1.4_

  - [ ]\* 1.6 Write property test for TaskSpec validation
    - **Property 2: TaskSpec validation rejects invalid inputs**
    - **Validates: Requirements 1.2, 1.4**

  - [ ] 1.7 Implement executor registration validation
    - Create `src/validation/executor.ts` with validateExecutorEntry() function
    - Validate required fields: name, supportedTaskTypes, endpoint
    - _Requirements: 4.3_

  - [ ]\* 1.8 Write property test for executor registration validation
    - **Property 12: Executor registration validation**
    - **Validates: Requirements 4.3**

- [ ] 2. Implement DynamoDB and S3 services in codex-core
  - [ ] 2.1 Create Codex DynamoDB service
    - Create `src/services/codex-db.ts` extending patterns from existing `packages/backend/src/services/dynamodb.ts`
    - Implement CRUD operations for all entity types using single-table design
    - Methods: putWorkspace, getWorkspace, putTask, getTask, listTasks, putRun, getRun, listRuns, putRunStep, listRunSteps, putArtifact, getArtifact, listArtifacts, putExecutor, getExecutor, listExecutors
    - Include retry logic with exponential backoff (max 3 attempts)
    - _Requirements: 6.1-6.7, 13.2_

  - [ ] 2.2 Create Codex S3 service
    - Create `src/services/codex-s3.ts` extending patterns from existing `packages/backend/src/services/s3.ts`
    - Implement artifact upload/download with pre-signed URLs
    - Implement workspace archive upload/download
    - S3 key generation following the path convention: `workspaces/{workspaceId}/runs/{runId}/artifacts/`
    - Include retry logic for uploads (max 3 attempts)
    - _Requirements: 3.1, 3.5, 11.2, 13.3_

  - [ ] 2.3 Implement guardrail service
    - Create `src/services/guardrails.ts`
    - Implement: checkArchiveSize, checkDailyQuota, checkConcurrency, truncateLog
    - Load guardrail config from environment or defaults
    - _Requirements: 7.1-7.6_

  - [ ]\* 2.4 Write property tests for guardrails
    - **Property 13: Archive size guardrail enforcement**
    - **Validates: Requirements 7.1**
    - **Property 14: Daily run quota enforcement**
    - **Validates: Requirements 7.2**
    - **Property 15: Concurrency limit enforcement**
    - **Validates: Requirements 7.4**
    - **Property 16: Log truncation at guardrail boundary**
    - **Validates: Requirements 7.6**

- [ ] 3. Checkpoint - Ensure all codex-core tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Codex Orchestrator
  - [ ] 4.1 Create `packages/codex-orchestrator` package
    - Add package.json, tsconfig.json
    - Depend on `@tlao/codex-core`
    - _Requirements: 2.1-2.8_

  - [ ] 4.2 Implement task creation flow
    - Create `src/orchestrator.ts` with `createTask(workspaceId, taskSpec)` method
    - Validate TaskSpec, generate taskId (UUID), store in DynamoDB
    - _Requirements: 1.1, 1.5_

  - [ ]\* 4.3 Write property test for task creation round-trip
    - **Property 1: Task creation round-trip**
    - **Validates: Requirements 1.1, 1.5**

  - [ ] 4.4 Implement run creation and executor selection
    - Add `createRun(workspaceId, taskId)` method
    - Check guardrails (quota, concurrency) before creating run
    - Select executor from registry based on taskType
    - Create Run record with status "queued"
    - _Requirements: 2.1, 2.2, 7.2, 7.4_

  - [ ]\* 4.5 Write property tests for run creation and executor selection
    - **Property 5: Run initial status is "queued"**
    - **Validates: Requirements 2.1**
    - **Property 6: Executor selection matches task type**
    - **Validates: Requirements 2.2**

  - [ ] 4.6 Implement run completion handling
    - Add `completeRun(runId, result)` method
    - Update Run status based on executor result (completed/failed)
    - Store logs (with truncation) and error details
    - Store artifacts via S3 service
    - _Requirements: 2.4, 2.5, 7.6_

  - [ ]\* 4.7 Write property test for run completion status
    - **Property 7: Run final status reflects executor result**
    - **Validates: Requirements 2.4, 2.5**

  - [ ] 4.8 Implement artifact storage and retrieval
    - Add `storeArtifact(runId, workspaceId, artifact)` method
    - Upload to S3 with correct key pattern, create Artifact record in DynamoDB
    - Add `getArtifact(workspaceId, artifactId)` method returning metadata + pre-signed URL
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]\* 4.9 Write property tests for artifact storage and retrieval
    - **Property 9: Artifact storage completeness**
    - **Validates: Requirements 3.1, 3.3, 3.5**
    - **Property 10: Artifact retrieval round-trip**
    - **Validates: Requirements 3.2**

  - [ ] 4.10 Implement executor registry loading
    - Add `loadExecutors()` method that reads from DynamoDB (PK=SYS, SK begins_with EXEC#)
    - Cache loaded executors in memory
    - _Requirements: 4.2_

  - [ ]\* 4.11 Write property test for executor registry round-trip
    - **Property 11: Executor registry round-trip**
    - **Validates: Requirements 4.2**

  - [ ] 4.12 Implement run listing with pagination
    - Add `listRuns(workspaceId, options)` method with cursor-based pagination
    - Query DynamoDB with PK=WS#{id}, SK begins_with RUN#
    - _Requirements: 2.6_

  - [ ]\* 4.13 Write property test for run list pagination
    - **Property 8: Run list pagination completeness**
    - **Validates: Requirements 2.6**

  - [ ] 4.14 Implement error handling with correlation IDs
    - Add correlation ID generation (UUID) to all orchestrator error responses
    - Ensure all error logs include workspaceId, runId (when available), and operation name
    - _Requirements: 13.1, 13.4_

  - [ ]\* 4.15 Write property tests for error handling
    - **Property 23: Error responses contain correlation ID**
    - **Validates: Requirements 13.1**
    - **Property 24: Error logs contain required context**
    - **Validates: Requirements 13.4**

- [ ] 5. Checkpoint - Ensure all orchestrator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Codex API (Lambda handlers)
  - [ ] 6.1 Create `packages/codex-api` package
    - Add package.json, tsconfig.json
    - Depend on `@tlao/codex-core`, `@tlao/codex-orchestrator`
    - _Requirements: 1.1, 2.1_

  - [ ] 6.2 Implement authentication middleware
    - Create `src/middleware/auth.ts` with JWT validation
    - Issue JWT on login with userId claim
    - Validate token on all protected routes, reject invalid/expired with 401
    - Enforce workspace ownership (403 for cross-workspace access)
    - _Requirements: 12.1-12.4_

  - [ ]\* 6.3 Write property tests for authentication
    - **Property 18: JWT contains correct identity claims**
    - **Validates: Requirements 12.1**
    - **Property 19: Token validation rejects invalid tokens**
    - **Validates: Requirements 12.2**
    - **Property 20: Workspace isolation**
    - **Validates: Requirements 12.3**

  - [ ] 6.4 Implement task and run API handlers
    - Create `src/handlers/tasks.ts` with POST /tasks handler
    - Create `src/handlers/runs.ts` with POST /runs, GET /runs, GET /runs/{id} handlers
    - Wire to orchestrator methods
    - Return consistent JSON responses with error format
    - _Requirements: 1.1-1.4, 2.1, 2.6, 2.7_

  - [ ] 6.5 Implement artifact API handler
    - Create `src/handlers/artifacts.ts` with GET /artifacts/{id} handler
    - Return metadata + pre-signed download URL
    - Return 404 for non-existent artifacts
    - _Requirements: 3.2, 3.4_

  - [ ] 6.6 Implement workspace and archive handlers
    - Create `src/handlers/workspaces.ts` with POST /workspaces, POST /workspaces/{id}/archive handlers
    - Validate archive size against guardrail before accepting upload
    - _Requirements: 11.1, 11.2, 7.1_

  - [ ]\* 6.7 Write property test for workspace creation uniqueness
    - **Property 25: Workspace creation produces unique IDs**
    - **Validates: Requirements 11.1**

  - [ ] 6.8 Implement SSE streaming endpoint for run logs
    - Create `src/handlers/stream.ts` with GET /runs/{id}/stream handler
    - Push ProgressEvents as SSE data frames with sequence numbers
    - Send terminal event on run completion/failure and close connection
    - Support `Last-Event-ID` header for reconnection
    - _Requirements: 10.1-10.4_

  - [ ]\* 6.9 Write property test for SSE reconnection
    - **Property 22: SSE reconnection resumes from correct sequence**
    - **Validates: Requirements 10.4**

  - [ ]\* 6.10 Write unit tests for API handlers
    - Test 404 for non-existent resources
    - Test 400 for invalid request bodies
    - Test 413 for oversized archives
    - Test 429 for quota exceeded
    - _Requirements: 1.3, 3.4, 7.1, 7.2_

- [ ] 7. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Kiro Worker executor
  - [ ] 8.1 Create `packages/kiro-worker` package with Dockerfile
    - Add package.json, tsconfig.json, Dockerfile
    - Depend on `@tlao/codex-core`
    - Configure as single-job container (entrypoint runs once and exits)
    - _Requirements: 5.7_

  - [ ] 8.2 Implement Kiro Worker executor logic
    - Create `src/worker.ts` implementing the Executor interface
    - Download TaskSpec from S3
    - Download and extract workspace archive from S3
    - Invoke Kiro CLI as child process with arguments from TaskSpec
    - Collect output files and upload as artifacts to S3
    - Update Run record in DynamoDB with final status, logs, artifact references
    - Handle non-zero exit codes: capture stderr, set status to "failed"
    - _Requirements: 5.1-5.6_

  - [ ]\* 8.3 Write unit tests for Kiro Worker
    - Test successful execution flow with mocked Kiro CLI
    - Test error handling for non-zero exit codes
    - Test S3 download/upload interactions
    - _Requirements: 5.1-5.6_

- [ ] 9. Implement CLI
  - [ ] 9.1 Create `packages/tlao-cli` package
    - Add package.json, tsconfig.json
    - Depend on `@tlao/codex-core`
    - Add CLI framework dependency (e.g., `commander`)
    - Configure bin entry point as `tlao`
    - _Requirements: 8.1-8.6_

  - [ ] 9.2 Implement workspace packaging
    - Create `src/packaging.ts`
    - Compress workspace to tar.gz respecting .gitignore rules
    - Exclude node_modules, .git, build output directories
    - _Requirements: 8.6, 11.3_

  - [ ]\* 9.3 Write property test for workspace packaging
    - **Property 17: Workspace packaging excludes ignored paths**
    - **Validates: Requirements 8.6, 11.3**

  - [ ] 9.4 Implement CLI commands
    - Create `src/commands/run.ts` for `tlao run plan` (package workspace, upload, create task+run, stream progress)
    - Create `src/commands/runs.ts` for `tlao runs` (list recent runs)
    - Create `src/commands/artifact.ts` for `tlao artifact get {id}` (download artifact)
    - Create `src/commands/login.ts` for `tlao login` (authenticate, store credentials)
    - Handle connection errors with troubleshooting guidance
    - _Requirements: 8.1-8.5_

  - [ ]\* 9.5 Write unit tests for CLI commands
    - Test argument parsing for each command
    - Test connection error handling
    - _Requirements: 8.1-8.5_

- [ ] 10. Implement SDK
  - [ ] 10.1 Create `packages/tlao-sdk` package
    - Add package.json, tsconfig.json
    - Export as `@tlao/sdk`
    - Depend on `@tlao/codex-core` for shared types
    - _Requirements: 9.1_

  - [ ] 10.2 Implement TlaoClient
    - Create `src/client.ts` with TlaoClient class
    - Implement methods: createTask, createRun, getRun, listRuns, getArtifact, streamRun
    - Throw typed errors with status code, message, and request context on API failures
    - _Requirements: 9.1-9.6_

  - [ ]\* 10.3 Write property test for SDK error typing
    - **Property 21: SDK error typing preserves error information**
    - **Validates: Requirements 9.6**

  - [ ]\* 10.4 Write unit tests for TlaoClient
    - Test each method with mocked HTTP responses
    - Test error handling for various HTTP status codes
    - _Requirements: 9.2-9.5_

- [ ] 11. Checkpoint - Ensure all CLI and SDK tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Web UI
  - [ ] 12.1 Create `apps/codex-web` Next.js application
    - Initialize Next.js app in apps/codex-web
    - Add to pnpm workspace
    - Configure Tailwind CSS (consistent with existing apps/landing)
    - _Requirements: 14.1_

  - [ ] 12.2 Implement Agent Console dashboard page
    - Create dashboard page showing recent runs, active executors, workspace summary
    - Fetch data from Codex API via SDK
    - _Requirements: 14.1_

  - [ ] 12.3 Implement Runs page
    - Create runs list page with status indicators, executor name, duration, timestamps
    - Create run detail page with log stream and linked artifacts
    - _Requirements: 14.2, 14.3_

  - [ ] 12.4 Implement Artifacts page
    - Create artifacts list page with type, size, download links
    - _Requirements: 14.4_

  - [ ] 12.5 Implement task submission from Web UI
    - Create task submission form
    - Submit via Codex API and display resulting run in real time
    - _Requirements: 14.5_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check`
- Unit tests validate specific examples and edge cases
- The implementation follows the existing monorepo patterns (AWS SDK v3, DynamoDB document client, S3 pre-signed URLs, structured error classes)

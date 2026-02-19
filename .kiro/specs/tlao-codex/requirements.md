# Requirements Document: TLÁO Codex

## Introduction

TLÁO Codex is the agent orchestration layer (control plane) of the TLÁO platform, publicly branded as "TLÁO Builder" or `tlao build`. It abstracts Kiro and future AI agents behind a unified execution system, providing a Task API, Run system, Artifact system, and Agent abstraction. Users interact with TLÁO Codex rather than individual executors. The core object model is Task → Run → Artifact, where Tasks define intent, Runs track execution, and Artifacts capture outputs.

The architecture separates a persistent Control Plane (owned by TLÁO Codex: state, API, UI, CLI, SDK) from a replaceable Execution Plane (Kiro CLI, future agents, local workers, Bedrock agents). The system targets AWS Free Tier compatibility and lives within an existing Turborepo monorepo.

## Glossary

- **TLÁO_Codex**: The agent orchestration layer and control plane of the TLÁO platform
- **Control_Plane**: The persistent layer that owns state, API, UI, CLI, and SDK
- **Execution_Plane**: The replaceable layer where executor workers run tasks
- **Task**: An intent definition specifying what work to perform (e.g., generate spec, refactor code, deploy infra)
- **TaskSpec**: The contract every executor must accept, containing taskType, input, constraints, and expected output
- **Run**: A specific execution instance of a Task, tracking executor, status, workspace, and logs
- **Artifact**: An output produced by a Run (execution plan JSON, code changes, proposal draft, infra template)
- **Executor**: A registered agent implementation that can execute tasks (e.g., Kiro Worker, Bedrock Agent)
- **Kiro_Worker**: A container-based executor that wraps the Kiro CLI for task execution
- **Workspace**: A user-scoped context containing tasks, runs, and artifacts
- **Workspace_Archive**: A compressed snapshot of a user's repository uploaded for executor processing
- **Codex_Orchestrator**: The Lambda function that creates runs, selects executors, enforces policies, and stores results
- **Codex_API**: The unified REST API (API Gateway + Lambda) exposing all TLÁO Codex endpoints
- **Single_Table_Design**: DynamoDB schema pattern using composite keys (PK/SK) to store multiple entity types in one table
- **SSE**: Server-Sent Events, used for streaming run logs and progress to clients
- **Guardrail**: An application-level limit enforced by the Codex_Orchestrator (archive size, run duration, token budget, quotas)
- **SDK**: The `@tlao/sdk` npm package providing a typed TlaoClient for programmatic access
- **CLI**: The `tlao` command-line interface for interacting with TLÁO Codex

## Requirements

### Requirement 1: Unified Task API

**User Story:** As a developer, I want to submit tasks through a unified API, so that I can request work from any executor without knowing the underlying agent implementation.

#### Acceptance Criteria

1. WHEN a user submits a POST request to `/tasks` with a valid TaskSpec, THE Codex_API SHALL create a Task record in DynamoDB and return the taskId
2. WHEN a user submits a TaskSpec, THE Codex_API SHALL validate that the taskType is one of the registered types (spec.generate, code.change, doc.write, deploy.run)
3. IF a user submits a TaskSpec with an invalid or missing taskType, THEN THE Codex_API SHALL return a 400 status with a descriptive error message
4. IF a user submits a TaskSpec with missing required fields (input.prompt), THEN THE Codex_API SHALL return a 400 status identifying the missing fields
5. WHEN a Task is created, THE Codex_API SHALL store the TaskSpec as a serialized JSON document in the Task record

### Requirement 2: Run Lifecycle Management

**User Story:** As a developer, I want to create and monitor runs, so that I can track the execution of my tasks from submission to completion.

#### Acceptance Criteria

1. WHEN a user submits a POST request to `/runs` with a valid taskId, THE Codex_Orchestrator SHALL create a Run record with status "queued" and return the runId
2. WHEN a Run is created, THE Codex_Orchestrator SHALL select an appropriate Executor based on the TaskSpec taskType and executor availability
3. WHILE a Run is in "running" status, THE Codex_Orchestrator SHALL update the Run record with progress events from the Executor
4. WHEN an Executor completes a Run, THE Codex_Orchestrator SHALL update the Run status to "completed" and store the final logs
5. IF an Executor fails during a Run, THEN THE Codex_Orchestrator SHALL update the Run status to "failed" and store the error details
6. WHEN a user submits a GET request to `/runs`, THE Codex_API SHALL return a paginated list of Runs for the user's Workspace
7. WHEN a user submits a GET request to `/runs/{id}`, THE Codex_API SHALL return the full Run record including status, logs, and linked artifact IDs
8. IF a Run exceeds the configured maximum duration guardrail, THEN THE Codex_Orchestrator SHALL terminate the Run and set status to "timed_out"

### Requirement 3: Artifact Storage and Retrieval

**User Story:** As a developer, I want to retrieve artifacts produced by runs, so that I can use the generated outputs (plans, code, documents) in my workflow.

#### Acceptance Criteria

1. WHEN an Executor produces output artifacts, THE Codex_Orchestrator SHALL upload each artifact to S3 and create an Artifact record in DynamoDB linking to the S3 key
2. WHEN a user submits a GET request to `/artifacts/{id}`, THE Codex_API SHALL return the artifact metadata and a pre-signed S3 URL for download
3. WHEN an Artifact record is created, THE Codex_Orchestrator SHALL store metadata including artifactType, size, runId, and creation timestamp
4. IF a user requests an artifact that does not exist, THEN THE Codex_API SHALL return a 404 status with a descriptive error message
5. WHEN artifacts are stored in S3, THE Codex_Orchestrator SHALL organize them under the path `workspaces/{workspaceId}/runs/{runId}/artifacts/`

### Requirement 4: Executor Abstraction and Registry

**User Story:** As a platform operator, I want to register and manage executors, so that I can add new agent types without modifying the core orchestration logic.

#### Acceptance Criteria

1. THE Codex_Orchestrator SHALL define an Executor interface requiring an `executeTask(taskSpec, context)` method that returns logs, artifacts, and status
2. WHEN the system starts, THE Codex_Orchestrator SHALL load registered executors from the DynamoDB executor registry (PK=SYS, SK=EXEC#{name})
3. WHEN a new executor is registered, THE Codex_Orchestrator SHALL validate that the executor entry contains name, supported task types, and endpoint configuration
4. IF no executor is available for a given taskType, THEN THE Codex_Orchestrator SHALL reject the Run creation with a 422 status and descriptive message
5. THE Codex_Orchestrator SHALL support adding new executors by inserting records into the executor registry without code changes to the orchestrator

### Requirement 5: Kiro Worker Executor

**User Story:** As a developer, I want to execute tasks using Kiro as the first executor, so that I can leverage Kiro's capabilities through the unified TLÁO interface.

#### Acceptance Criteria

1. WHEN the Kiro_Worker receives a task, THE Kiro_Worker SHALL download the TaskSpec from S3 using the provided S3 key
2. WHEN the Kiro_Worker receives a workspace archive key, THE Kiro_Worker SHALL download and extract the workspace archive from S3
3. WHEN the Kiro_Worker has the TaskSpec and workspace, THE Kiro_Worker SHALL invoke the Kiro CLI with the appropriate arguments
4. WHEN the Kiro CLI completes, THE Kiro_Worker SHALL collect all output files and upload them as artifacts to S3
5. WHEN the Kiro_Worker finishes processing, THE Kiro_Worker SHALL update the Run record in DynamoDB with final status, logs, and artifact references
6. IF the Kiro CLI exits with a non-zero code, THEN THE Kiro_Worker SHALL capture stderr, update the Run status to "failed", and store the error log
7. THE Kiro_Worker SHALL run as a single-job container that exits after completing one task

### Requirement 6: DynamoDB Single Table Design

**User Story:** As a platform operator, I want all entities stored in a single DynamoDB table with composite keys, so that I can minimize table count and stay within Free Tier limits.

#### Acceptance Criteria

1. THE Codex_Orchestrator SHALL store Workspace entities with PK=WS#{workspaceId} and SK=META
2. THE Codex_Orchestrator SHALL store Task entities with PK=WS#{workspaceId} and SK=TASK#{taskId}
3. THE Codex_Orchestrator SHALL store Run entities with PK=WS#{workspaceId} and SK=RUN#{runId}
4. THE Codex_Orchestrator SHALL store Run step/timeline entries with PK=RUN#{runId} and SK=STEP#{sequenceNumber}
5. THE Codex_Orchestrator SHALL store Artifact entities with PK=WS#{workspaceId} and SK=ART#{artifactId}
6. THE Codex_Orchestrator SHALL store Executor registry entries with PK=SYS and SK=EXEC#{executorName}
7. WHEN serializing an entity to DynamoDB, THE Codex_Orchestrator SHALL produce a valid DynamoDB item, and WHEN deserializing that item, THE Codex_Orchestrator SHALL produce an equivalent entity (round-trip consistency)

### Requirement 7: Guardrails and Resource Limits

**User Story:** As a platform operator, I want to enforce resource limits on runs, so that the system stays within AWS Free Tier constraints and prevents abuse.

#### Acceptance Criteria

1. WHEN a user submits a workspace archive, THE Codex_API SHALL reject archives exceeding the maximum size guardrail (30MB) with a 413 status
2. WHEN a Run is created, THE Codex_Orchestrator SHALL enforce a daily run quota per workspace and reject runs exceeding the quota with a 429 status
3. WHILE a Run is executing, THE Codex_Orchestrator SHALL enforce the maximum run duration guardrail (8 minutes) and terminate runs that exceed the limit
4. THE Codex_Orchestrator SHALL enforce a concurrency limit of 2 simultaneous runs per workspace
5. IF a workspace has reached its concurrency limit, THEN THE Codex_Orchestrator SHALL queue the run and process it when a slot becomes available
6. WHEN storing run logs, THE Codex_Orchestrator SHALL truncate logs exceeding the maximum log size guardrail

### Requirement 8: CLI Interface

**User Story:** As a developer, I want to interact with TLÁO Codex from the command line, so that I can submit tasks, monitor runs, and retrieve artifacts without leaving my terminal.

#### Acceptance Criteria

1. WHEN a user runs `tlao run plan`, THE CLI SHALL package the current workspace, upload the archive to S3, create a Task and Run, and stream progress to the terminal
2. WHEN a user runs `tlao runs`, THE CLI SHALL display a paginated list of recent runs with status, executor, and timestamps
3. WHEN a user runs `tlao artifact get {id}`, THE CLI SHALL download the specified artifact to the current directory
4. WHEN a user runs `tlao login`, THE CLI SHALL initiate authentication and store credentials locally
5. IF the CLI cannot reach the Codex_API, THEN THE CLI SHALL display a connection error with troubleshooting guidance
6. WHEN the CLI packages a workspace, THE CLI SHALL respect .gitignore rules and exclude node_modules, .git, and build output directories

### Requirement 9: SDK for Programmatic Access

**User Story:** As a developer, I want a typed SDK to interact with TLÁO Codex programmatically, so that I can integrate task execution into my applications and scripts.

#### Acceptance Criteria

1. THE SDK SHALL export a TlaoClient class that accepts configuration (apiUrl, credentials) and provides methods for all Codex_API endpoints
2. WHEN a developer calls `client.createTask(taskSpec)`, THE SDK SHALL send a POST request to `/tasks` and return a typed Task response
3. WHEN a developer calls `client.createRun(taskId)`, THE SDK SHALL send a POST request to `/runs` and return a typed Run response
4. WHEN a developer calls `client.getRun(runId)`, THE SDK SHALL send a GET request to `/runs/{id}` and return a typed Run response
5. WHEN a developer calls `client.getArtifact(artifactId)`, THE SDK SHALL send a GET request to `/artifacts/{id}` and return artifact metadata with a download URL
6. IF an API call fails, THEN THE SDK SHALL throw a typed error containing status code, error message, and request context

### Requirement 10: Run Log Streaming

**User Story:** As a developer, I want to see real-time progress of my runs, so that I can monitor execution without polling.

#### Acceptance Criteria

1. WHEN a user subscribes to a Run's log stream, THE Codex_API SHALL establish an SSE connection and push log events as they arrive
2. WHILE a Run is in "running" status, THE Codex_API SHALL forward progress events from the Executor to all subscribed clients
3. WHEN a Run completes or fails, THE Codex_API SHALL send a terminal event and close the SSE connection
4. IF the SSE connection drops, THEN THE CLI or SDK SHALL reconnect and resume from the last received event sequence number

### Requirement 11: Workspace Management

**User Story:** As a developer, I want to manage my workspace context, so that executors have the right files and configuration to perform tasks.

#### Acceptance Criteria

1. WHEN a user creates a workspace, THE Codex_API SHALL create a Workspace record in DynamoDB with a unique workspaceId
2. WHEN a user uploads a workspace archive, THE Codex_API SHALL store the archive in S3 under `workspaces/{workspaceId}/archives/`
3. WHEN the CLI packages a workspace archive, THE CLI SHALL compress the workspace into a tar.gz file excluding ignored paths
4. IF a workspace archive exceeds the size guardrail, THEN THE Codex_API SHALL reject the upload with a 413 status and include the maximum allowed size in the error response

### Requirement 12: Authentication and Authorization

**User Story:** As a platform user, I want to authenticate securely, so that my workspaces, runs, and artifacts are protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user authenticates via `tlao login`, THE Codex_API SHALL issue a session token (JWT) scoped to the user's identity
2. FOR ALL API requests, THE Codex_API SHALL validate the session token and reject requests with invalid or expired tokens with a 401 status
3. WHEN a user accesses a resource, THE Codex_API SHALL verify that the resource belongs to the user's workspace before returning data
4. IF a user attempts to access another user's workspace or artifacts, THEN THE Codex_API SHALL return a 403 status

### Requirement 13: Error Handling and Resilience

**User Story:** As a developer, I want the system to handle failures gracefully, so that I can understand what went wrong and recover.

#### Acceptance Criteria

1. WHEN the Codex_Orchestrator encounters an error during Run creation, THE Codex_Orchestrator SHALL return a descriptive error response with a correlation ID for debugging
2. IF a DynamoDB write fails, THEN THE Codex_Orchestrator SHALL retry with exponential backoff (max 3 attempts) before returning an error
3. IF an S3 upload fails during artifact storage, THEN THE Codex_Orchestrator SHALL retry the upload and mark the artifact as "upload_failed" if all retries fail
4. WHEN an error occurs in any component, THE component SHALL log the error with context (workspaceId, runId, operation) to CloudWatch
5. IF the Executor Worker crashes during a Run, THEN THE Codex_Orchestrator SHALL detect the failure via health check timeout and update the Run status to "failed"

### Requirement 14: Web UI Agent Console

**User Story:** As a user, I want a web-based console to manage tasks, monitor runs, and browse artifacts, so that I can use TLÁO Codex without the CLI.

#### Acceptance Criteria

1. WHEN a user navigates to the Agent Console, THE Web_UI SHALL display a dashboard showing recent runs, active executors, and workspace summary
2. WHEN a user views the Runs page, THE Web_UI SHALL display a list of runs with status indicators, executor name, duration, and timestamps
3. WHEN a user views a specific Run, THE Web_UI SHALL display the run details, log stream, and linked artifacts
4. WHEN a user views the Artifacts page, THE Web_UI SHALL display a browsable list of artifacts with type, size, and download links
5. WHEN a user initiates a task from the Web_UI, THE Web_UI SHALL submit the task via the Codex_API and display the resulting run in real time

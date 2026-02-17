# Design Document: Kiro Custom Agents Documentation

## Overview

This design specifies the structure, content, and implementation approach for adding comprehensive custom agents documentation to the existing TLÁO Docusaurus documentation site. The documentation will be organized as a new section that integrates seamlessly with the existing documentation structure, following established patterns and conventions.

The documentation will consist of multiple pages covering custom agents from introduction through advanced configuration, with practical examples and clear guidance for developers at all skill levels.

## Architecture

### Documentation Structure

The custom agents documentation will be organized in a dedicated directory within the existing docs structure:

```
apps/docs/docs/
├── intro.md
├── concepts/
│   ├── why-layer.md
│   ├── why-tactical.md
│   └── action-outcomes.md
├── custom-agents/              # NEW
│   ├── _category_.json         # Category metadata
│   ├── introduction.md         # What are custom agents?
│   ├── getting-started.md      # Creating your first custom agent
│   ├── configuration.md        # Configuration reference
│   ├── tool-access.md          # Tool access control and pre-approval
│   └── examples.md             # Real-world examples
└── tutorial-basics/
    └── ...
```

### Navigation Integration

The sidebar will be updated to include the custom agents section. Since the existing `sidebars.ts` uses autogeneration, the new section will automatically appear in the navigation based on the directory structure and frontmatter configuration.

### Page Organization

Each documentation page will follow this structure:

1. **Frontmatter**: Metadata including sidebar position and title
2. **Introduction**: Brief overview of the page content
3. **Main Content**: Detailed information organized with clear headings
4. **Code Examples**: Practical, runnable examples with syntax highlighting
5. **Next Steps**: Links to related documentation

## Components and Interfaces

### Documentation Pages

#### 1. Introduction Page (`introduction.md`)

**Purpose**: Provide a high-level overview of custom agents

**Content Sections**:

- What are custom agents?
- Why use custom agents?
- Key benefits (workflow optimization, reduced interruptions, enhanced context, team collaboration, security control)
- How custom agents relate to Kiro CLI
- When to use custom agents vs. default behavior

**Frontmatter**:

```yaml
---
sidebar_position: 1
---
```

#### 2. Getting Started Page (`getting-started.md`)

**Purpose**: Guide users through creating their first custom agent

**Content Sections**:

- Prerequisites (Kiro CLI installation)
- Creating a custom agent configuration file
- Basic configuration structure
- Running Kiro with a custom agent
- Verifying the custom agent is working
- Common first-time issues and solutions

**Frontmatter**:

```yaml
---
sidebar_position: 2
---
```

#### 3. Configuration Reference Page (`configuration.md`)

**Purpose**: Comprehensive reference for all configuration options

**Content Sections**:

- Configuration file format (JSON/YAML)
- Configuration file location
- Core configuration options:
  - Agent name and description
  - System prompts and instructions
  - Model selection
  - Temperature and other parameters
  - Context window settings
- Advanced configuration options
- Configuration validation
- Configuration examples for common scenarios

**Frontmatter**:

```yaml
---
sidebar_position: 3
---
```

#### 4. Tool Access Control Page (`tool-access.md`)

**Purpose**: Explain tool access control and security features

**Content Sections**:

- Overview of tool access control
- Built-in Kiro tools
- MCP (Model Context Protocol) tools
- Configuring tool access:
  - Allowing specific tools
  - Denying specific tools
  - Tool categories
- Pre-approval feature:
  - What is pre-approval?
  - When to use pre-approval
  - Security considerations
  - Configuring pre-approved tools
- Best practices for tool security
- Audit and logging

**Frontmatter**:

```yaml
---
sidebar_position: 4
---
```

#### 5. Examples Page (`examples.md`)

**Purpose**: Provide real-world custom agent configurations

**Content Sections**:

- Example 1: AWS Infrastructure Agent
  - Use case description
  - Configuration code
  - Explanation of key settings
  - Benefits and workflow improvements
- Example 2: Code Review Agent
  - Use case description
  - Configuration code
  - Explanation of key settings
  - Benefits and workflow improvements
- Example 3: Debugging Agent
  - Use case description
  - Configuration code
  - Explanation of key settings
  - Benefits and workflow improvements
- Additional example ideas (brief descriptions)
- Customizing examples for your needs

**Frontmatter**:

```yaml
---
sidebar_position: 5
---
```

#### 6. Category Configuration (`_category_.json`)

**Purpose**: Define the custom agents section in the sidebar

**Content**:

```json
{
  "label": "Custom Agents",
  "position": 3,
  "link": {
    "type": "generated-index",
    "description": "Learn how to create and configure custom agents to optimize your Kiro workflow."
  }
}
```

### Sidebar Integration

The existing `sidebars.ts` uses autogeneration:

```typescript
const sidebars: SidebarsConfig = {
  tutorialSidebar: [{ type: 'autogenerated', dirName: '.' }],
}
```

This means the new `custom-agents/` directory will automatically appear in the sidebar. The `_category_.json` file controls the section's label, position, and description.

### Content Style Guidelines

Based on the existing documentation, the custom agents documentation will follow these patterns:

1. **Conversational but Professional**: Use clear, direct language without being overly formal
2. **Visual Hierarchy**: Use headings, subheadings, and lists to organize information
3. **Code Examples**: Include complete, runnable examples with proper syntax highlighting
4. **Diagrams**: Use ASCII art or Mermaid diagrams where helpful
5. **Cross-References**: Link to related documentation pages
6. **Practical Focus**: Emphasize real-world usage over theoretical concepts

## Data Models

### Custom Agent Configuration Schema

The documentation will reference this configuration structure:

```typescript
interface CustomAgentConfig {
  // Basic metadata
  name: string
  description?: string
  version?: string

  // Agent behavior
  systemPrompt?: string
  instructions?: string[]

  // Model configuration
  model?: string
  temperature?: number
  maxTokens?: number

  // Tool access control
  tools?: {
    allow?: string[]
    deny?: string[]
    preApprove?: string[]
  }

  // MCP integration
  mcpServers?: {
    [serverName: string]: {
      command: string
      args?: string[]
      env?: Record<string, string>
    }
  }

  // Context and memory
  contextWindow?: number
  memoryStrategy?: 'full' | 'summarize' | 'sliding'

  // Workflow customization
  autoApprove?: boolean
  confirmBeforeExecution?: boolean

  // Additional metadata
  tags?: string[]
  author?: string
  createdAt?: string
  updatedAt?: string
}
```

### Documentation Page Metadata

Each documentation page uses Docusaurus frontmatter:

```yaml
---
sidebar_position: number
title: string (optional, defaults to first heading)
description: string (optional, for SEO)
keywords: string[] (optional, for SEO)
---
```

### Example Configuration Models

The examples page will showcase three complete configurations:

1. **AWS Infrastructure Agent**:
   - Pre-approved AWS CLI tools
   - Infrastructure-focused system prompt
   - Higher temperature for creative problem-solving
   - MCP server for AWS SDK integration

2. **Code Review Agent**:
   - Pre-approved git and file reading tools
   - Code quality focused system prompt
   - Lower temperature for consistent analysis
   - Deny file writing tools for safety

3. **Debugging Agent**:
   - Pre-approved debugging and logging tools
   - Problem-solving focused system prompt
   - Medium temperature for balanced reasoning
   - MCP server for debugger integration

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Example Completeness

_For any_ example configuration on the examples page, it should include both complete configuration code and explanatory text describing the purpose and benefits.

**Validates: Requirements 5.4, 5.5**

### Property 2: Docusaurus Convention Compliance

_For any_ markdown file in the custom-agents directory, it should follow Docusaurus conventions including .md extension, location in docs directory, and valid YAML frontmatter.

**Validates: Requirements 7.3**

### Property 3: Frontmatter Presence

_For any_ documentation page in the custom-agents directory, it should contain valid frontmatter metadata with at least a sidebar_position field.

**Validates: Requirements 7.4**

### Property 4: Configuration Syntax Validity

_For any_ code block marked as JSON or YAML in the documentation, the content should parse successfully without syntax errors.

**Validates: Requirements 8.1**

### Property 5: Code Block Syntax Highlighting

_For any_ code block in the custom agents documentation, it should have a language specifier for proper syntax highlighting (e.g., `json, `yaml, `bash, `typescript).

**Validates: Requirements 8.4**

## Error Handling

### Missing Files

If documentation files are not created or are deleted:

- Docusaurus build will fail with clear error messages
- Broken links will be detected during build
- CI/CD pipeline will catch issues before deployment

### Invalid Frontmatter

If frontmatter is malformed:

- Docusaurus will fail to parse the file
- Build process will report the specific file and error
- Default values may be used for optional fields

### Broken Links

If internal links are broken:

- Docusaurus link checker will identify broken references
- Build warnings or errors will be generated
- Links should be tested as part of the documentation review process

### Invalid Code Examples

If code examples contain syntax errors:

- Property tests will catch JSON/YAML parsing errors
- Manual review should catch logical errors
- User feedback may identify issues post-deployment

### Sidebar Configuration Issues

If `_category_.json` is malformed:

- Docusaurus will fail to generate the sidebar correctly
- The section may not appear or may appear incorrectly
- Build process will report configuration errors

## Testing Strategy

The custom agents documentation will be validated through a combination of unit tests and property-based tests to ensure completeness, correctness, and consistency.

### Unit Tests

Unit tests will verify specific examples and content requirements:

1. **Content Presence Tests**:
   - Verify introduction.md exists and contains custom agents definition
   - Verify all five benefits are listed in the introduction
   - Verify getting-started.md contains step-by-step instructions
   - Verify configuration.md documents all configuration options
   - Verify tool-access.md explains pre-approval feature
   - Verify examples.md contains AWS, code review, and debugging examples
   - Verify _category_.json exists with correct structure

2. **File Structure Tests**:
   - Verify custom-agents directory exists in apps/docs/docs/
   - Verify all expected files are present
   - Verify file naming follows kebab-case convention

3. **Integration Tests**:
   - Verify sidebar includes custom agents section
   - Verify category configuration is valid JSON
   - Verify Docusaurus build succeeds with new documentation

4. **Link Validation Tests**:
   - Verify all internal links point to existing pages
   - Verify all code examples reference valid configuration options

### Property-Based Tests

Property tests will verify universal rules across all documentation content. Each test should run a minimum of 100 iterations.

1. **Property Test: Example Completeness**
   - **Feature: kiro-custom-agents-docs, Property 1: For any example configuration on the examples page, it should include both complete configuration code and explanatory text describing the purpose and benefits**
   - Generate: Parse examples.md and extract all example sections
   - Test: For each example, verify it contains a code block and explanatory text
   - Validates: Requirements 5.4, 5.5

2. **Property Test: Docusaurus Convention Compliance**
   - **Feature: kiro-custom-agents-docs, Property 2: For any markdown file in the custom-agents directory, it should follow Docusaurus conventions including .md extension, location in docs directory, and valid YAML frontmatter**
   - Generate: List all files in custom-agents directory
   - Test: For each file, verify .md extension, correct location, and parseable frontmatter
   - Validates: Requirements 7.3

3. **Property Test: Frontmatter Presence**
   - **Feature: kiro-custom-agents-docs, Property 3: For any documentation page in the custom-agents directory, it should contain valid frontmatter metadata with at least a sidebar_position field**
   - Generate: List all .md files in custom-agents directory
   - Test: For each file, parse frontmatter and verify sidebar_position exists
   - Validates: Requirements 7.4

4. **Property Test: Configuration Syntax Validity**
   - **Feature: kiro-custom-agents-docs, Property 4: For any code block marked as JSON or YAML in the documentation, the content should parse successfully without syntax errors**
   - Generate: Extract all code blocks with `json or `yaml tags from all documentation files
   - Test: For each code block, attempt to parse as JSON or YAML and verify no errors
   - Validates: Requirements 8.1

5. **Property Test: Code Block Syntax Highlighting**
   - **Feature: kiro-custom-agents-docs, Property 5: For any code block in the custom agents documentation, it should have a language specifier for proper syntax highlighting**
   - Generate: Extract all code blocks (``` markers) from all custom-agents documentation files
   - Test: For each code block, verify it has a language specifier (not just ```)
   - Validates: Requirements 8.4

### Testing Tools

- **Jest**: For unit tests and property-based tests
- **fast-check**: Property-based testing library for JavaScript/TypeScript
- **js-yaml**: For parsing and validating YAML frontmatter and code blocks
- **JSON.parse**: For validating JSON code blocks
- **Docusaurus Build**: Integration test via build process

### Test Organization

Tests will be organized in the existing test structure:

```
apps/docs/__tests__/
├── branding.test.ts
├── concepts.test.ts
├── config.test.ts
└── custom-agents.test.ts  # NEW
```

The new `custom-agents.test.ts` file will contain both unit tests and property-based tests for the custom agents documentation.

### Continuous Integration

All tests will run as part of the CI/CD pipeline:

1. Run unit tests to verify content presence
2. Run property tests to verify universal rules
3. Run Docusaurus build to verify integration
4. Deploy only if all tests pass

This dual testing approach ensures both specific content requirements (unit tests) and universal correctness properties (property tests) are validated, providing comprehensive coverage of the documentation quality.

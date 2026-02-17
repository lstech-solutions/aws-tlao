---
sidebar_position: 4
---

# Tool Access Control

Tool access control is one of the most powerful features of custom agents, allowing you to precisely define what actions an agent can perform. By configuring tool access, you can create specialized agents that are both capable and secure, tailored to specific workflows while maintaining appropriate safety boundaries.

## Overview

Every custom agent has access to a set of tools that enable it to interact with your codebase, execute commands, and perform various operations. Tool access control lets you:

- **Restrict capabilities** to only what's needed for the agent's purpose
- **Pre-approve trusted tools** to reduce interruptions and automate workflows
- **Integrate external tools** via Model Context Protocol (MCP) servers
- **Maintain security** by limiting access to sensitive operations

## Built-in Kiro Tools

Kiro provides a comprehensive set of built-in tools organized into categories. When configuring your custom agent, you can include entire categories or specific tools.

### Tool Categories

**read** - File reading and code analysis

- Read files with optional line ranges
- Read multiple files simultaneously
- Parse and analyze code structure
- Search file contents

**write** - File modification and creation

- Create new files
- Append to existing files
- Replace text in files
- Edit code using AST-based operations
- Rename symbols across the codebase
- Move and rename files with automatic import updates

**shell** - Command execution

- Execute bash commands
- Start and manage background processes
- Control long-running services
- Read process output

**grep** - Text search operations

- Fast regex-based search across files
- Case-sensitive and case-insensitive search
- Include/exclude file patterns
- Context around matches

**glob** - File discovery

- Fuzzy file search by path
- List directory contents
- Recursive directory traversal
- Pattern-based file matching

**thinking** - Internal reasoning

- Structured problem-solving
- Planning and strategy development
- Self-reflection on approach

**report** - Progress communication

- Report progress on long-running tasks
- Communicate status updates
- Provide structured feedback

**introspect** - Self-awareness

- Analyze own capabilities
- Reflect on decision-making
- Evaluate approach effectiveness

**knowledge** - Information access

- Access documentation and knowledge bases
- Retrieve contextual information
- Query stored knowledge

**todo** - Task management

- Create and manage task lists
- Track progress on multi-step operations
- Organize work items

**delegate** - Subagent coordination

- Invoke specialized subagents
- Delegate complex subtasks
- Coordinate multi-agent workflows

**aws** - AWS operations (if configured)

- AWS service interactions
- Infrastructure management
- Cloud resource operations

### Configuring Tool Access

In your agent configuration, specify which tool categories the agent can use:

```json
{
  "name": "my-agent",
  "tools": ["read", "write", "grep", "thinking"]
}
```

This configuration gives the agent access to file reading, writing, searching, and internal reasoning tools, but not shell execution or other categories.

## Model Context Protocol (MCP) Integration

MCP servers extend your custom agent's capabilities with external tools. These can include database access, API integrations, specialized analysis tools, and more.

### Adding MCP Servers

Configure MCP servers in the `mcpServers` field of your agent configuration:

```json
{
  "name": "database-agent",
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  },
  "tools": ["read", "@database"]
}
```

### MCP Tool Syntax

Reference MCP tools in your `tools` array using these formats:

- `@server_name` - Include all tools from the MCP server
- `@server_name/tool_name` - Include a specific tool from the server

Example with specific tools:

```json
{
  "tools": ["read", "write", "@database/query", "@database/schema"]
}
```

### Global MCP Configuration

You can also configure MCP servers globally and reference them in multiple agents by setting `includeMcpJson` to `true`:

```json
{
  "name": "my-agent",
  "includeMcpJson": true,
  "tools": ["read", "@global-server"]
}
```

Add global MCP servers using the CLI:

```bash
kiro --add-mcp '{"name":"server-name","command":"path/to/server","args":["arg1"]}'
```

## Pre-Approval: Automating Trusted Operations

Pre-approval is a powerful feature that allows specific tools to execute without user confirmation. This reduces interruptions and enables true automation for trusted operations.

### What is Pre-Approval?

By default, when an agent wants to use a tool (especially write or shell tools), Kiro asks for user confirmation. Pre-approval bypasses this confirmation for specified tools, allowing the agent to work autonomously.

### When to Use Pre-Approval

Pre-approval is ideal for:

- **Repetitive workflows** where you trust the agent's judgment
- **Read-only operations** that don't modify your system
- **Well-defined tasks** with clear boundaries
- **Automated processes** that run without supervision
- **Time-sensitive operations** where interruptions are costly

### When NOT to Use Pre-Approval

Avoid pre-approval for:

- **Destructive operations** like file deletion or system modifications
- **Untested agents** that haven't proven reliable
- **Broad permissions** that could affect many files
- **Shell commands** with system-wide impact
- **Operations on critical files** or production systems

### Security Considerations

Pre-approval requires careful thought about security implications:

1. **Principle of Least Privilege**: Only pre-approve the minimum tools needed
2. **Scope Limitation**: Consider what files and systems the tools can affect
3. **Audit Trail**: Monitor what pre-approved tools are actually doing
4. **Gradual Expansion**: Start with no pre-approvals, add them as you build trust
5. **Regular Review**: Periodically review and adjust pre-approved tools

### Configuring Pre-Approved Tools

Use the `allowedTools` array to specify pre-approved tools:

```json
{
  "name": "docs-writer",
  "tools": ["read", "write", "grep"],
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "fsWrite"]
}
```

In this example, the agent can read files and search without confirmation, and can write new files (but other write operations like `strReplace` still require confirmation).

### Pre-Approval Examples

**Conservative approach** (read-only pre-approval):

```json
{
  "name": "code-analyzer",
  "tools": ["read", "grep", "glob", "thinking"],
  "allowedTools": [
    "readFile",
    "readMultipleFiles",
    "readCode",
    "grepSearch",
    "fileSearch",
    "listDirectory"
  ]
}
```

**Moderate approach** (safe write operations):

```json
{
  "name": "test-writer",
  "tools": ["read", "write", "grep"],
  "allowedTools": ["readFile", "readCode", "grepSearch", "fsWrite", "fsAppend"]
}
```

**Aggressive approach** (full automation - use with caution):

```json
{
  "name": "automation-agent",
  "tools": ["read", "write", "shell", "grep"],
  "allowedTools": [
    "readFile",
    "readCode",
    "grepSearch",
    "fsWrite",
    "fsAppend",
    "strReplace",
    "editCode",
    "executeBash"
  ]
}
```

## Tool Access Configuration Examples

### Example 1: Documentation Writer (Safe)

A documentation-focused agent with limited, pre-approved tools:

```json
{
  "name": "docs-writer",
  "description": "Specialized agent for writing and maintaining documentation",
  "tools": ["read", "write", "grep", "glob", "thinking"],
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "fileSearch"]
}
```

This agent can read and search freely, but write operations require confirmation.

### Example 2: Code Reviewer (Read-Only)

A code review agent that cannot modify files:

```json
{
  "name": "code-reviewer",
  "description": "Code review specialist that analyzes without modifying",
  "tools": ["read", "grep", "glob", "thinking", "report"],
  "allowedTools": [
    "readFile",
    "readMultipleFiles",
    "readCode",
    "grepSearch",
    "fileSearch",
    "listDirectory",
    "getDiagnostics"
  ]
}
```

All tools are pre-approved since none can modify the codebase.

### Example 3: Test Automation Agent

An agent for automated test creation with selective pre-approval:

```json
{
  "name": "test-automator",
  "description": "Automated test generation and execution",
  "tools": ["read", "write", "shell", "grep", "thinking"],
  "allowedTools": ["readFile", "readCode", "grepSearch", "fsWrite"]
}
```

Can read and create new test files automatically, but modifications and test execution require confirmation.

### Example 4: Database Agent with MCP

An agent that integrates with a database via MCP:

```json
{
  "name": "database-agent",
  "description": "Database query and schema management",
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  },
  "tools": ["read", "write", "@postgres/query", "@postgres/schema", "thinking"],
  "allowedTools": ["readFile", "@postgres/query"]
}
```

Can read files and execute database queries automatically, but schema changes require confirmation.

## Security Best Practices

### 1. Start Restrictive, Expand Gradually

Begin with minimal tool access and no pre-approvals. As you gain confidence in the agent's behavior, gradually add tools and pre-approvals.

```json
// Start here
{
  "tools": ["read", "thinking"],
  "allowedTools": []
}

// Then expand
{
  "tools": ["read", "write", "thinking"],
  "allowedTools": ["readFile", "readCode"]
}

// Finally, if needed
{
  "tools": ["read", "write", "grep", "thinking"],
  "allowedTools": ["readFile", "readCode", "grepSearch", "fsWrite"]
}
```

### 2. Separate Agents by Risk Level

Create different agents for different risk levels:

- **High-risk operations**: No pre-approvals, full confirmation required
- **Medium-risk operations**: Limited pre-approvals for read operations
- **Low-risk operations**: Broader pre-approvals for trusted workflows

### 3. Use Read-Only Agents for Analysis

For code review, analysis, and exploration tasks, create read-only agents:

```json
{
  "tools": ["read", "grep", "glob", "thinking"],
  "allowedTools": ["readFile", "readCode", "grepSearch", "fileSearch"]
}
```

### 4. Limit Shell Access

Shell commands can have system-wide impact. Only include shell tools when absolutely necessary, and rarely pre-approve them:

```json
{
  "tools": ["read", "write", "shell"],
  "allowedTools": [
    "readFile",
    "fsWrite"
    // Note: No shell tools pre-approved
  ]
}
```

### 5. Scope MCP Servers Appropriately

When using MCP servers, carefully consider what operations they enable:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        // Use read-only database credentials
        "DATABASE_URL": "postgresql://readonly_user@localhost/mydb"
      }
    }
  }
}
```

### 6. Regular Security Audits

Periodically review your agent configurations:

- Are all pre-approved tools still necessary?
- Have any agents accumulated too many permissions?
- Are there agents that are no longer used?
- Do tool access patterns match intended use cases?

### 7. Version Control Your Agents

Store agent configurations in version control to:

- Track changes over time
- Review modifications before deployment
- Share configurations with team members
- Rollback problematic changes

### 8. Test in Safe Environments

Before deploying agents with broad permissions:

- Test in isolated development environments
- Use test repositories or branches
- Verify behavior with various prompts
- Monitor what tools are actually used

## Audit and Logging

### Monitoring Tool Usage

Kiro logs all tool invocations, which you can review to understand agent behavior:

- What tools are being used most frequently?
- Are pre-approved tools being used appropriately?
- Are there unexpected tool usage patterns?
- Which operations require the most confirmations?

### Reviewing Agent Activity

After using a custom agent, review the session to:

1. Verify all operations were appropriate
2. Identify opportunities for pre-approval
3. Spot potential security concerns
4. Refine tool access configuration

### Adjusting Based on Usage

Use audit information to refine your agent configurations:

- Add pre-approvals for frequently confirmed safe operations
- Remove tool access that's never used
- Tighten restrictions if concerning patterns emerge
- Document rationale for configuration decisions

## Next Steps

Now that you understand tool access control, explore:

- **[Examples](./examples.md)** - See complete agent configurations with different tool access patterns
- **[Configuration Reference](./configuration.md)** - Learn about all configuration options
- **[Getting Started](./getting-started.md)** - Create your first custom agent

Remember: tool access control is about finding the right balance between automation and safety. Start conservative, build trust through testing, and expand permissions thoughtfully as you gain confidence in your agents' behavior.

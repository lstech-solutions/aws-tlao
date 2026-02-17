---
sidebar_position: 5
---

# Custom Agent Examples

This page provides complete, real-world custom agent configurations that you can use as starting points for your own agents. Each example includes the full configuration, an explanation of key settings, and the benefits of using that configuration.

## Example 1: AWS Infrastructure Agent

A specialized agent for managing AWS infrastructure with pre-approved AWS tools and limited destructive operations.

### Use Case

This agent is designed for DevOps engineers who need to manage AWS resources regularly. It has access to AWS-specific tools but restricts destructive operations to prevent accidental resource deletion.

### Configuration

```json
{
  "name": "aws-infrastructure-agent",
  "description": "A specialized agent for AWS infrastructure management with security-focused tool access",
  "prompt": "You are an AWS infrastructure specialist. Your role is to:\n\n- Help design and implement cloud architectures on AWS\n- Assist with infrastructure as code (Terraform, CloudFormation)\n- Optimize AWS resource usage and costs\n- Implement security best practices for cloud resources\n- Troubleshoot infrastructure issues and suggest solutions\n\nYou have access to AWS-specific tools for reading, analyzing, and managing infrastructure. You can execute shell commands for AWS CLI operations. Always verify destructive operations before proceeding and explain the impact of changes.",
  "mcpServers": {
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {}
    }
  },
  "tools": ["read", "write", "shell", "grep", "glob", "thinking", "report", "aws"],
  "toolAliases": {},
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "listDirectory", "executeBash"],
  "resources": [],
  "hooks": {},
  "toolsSettings": {
    "shell": {
      "confirmBeforeExecution": true
    }
  },
  "includeMcpJson": true,
  "model": null
}
```

### Key Settings Explained

- **Pre-approved read tools**: The agent can read files and execute read-only shell commands without confirmation
- **AWS MCP server**: Integrates with AWS MCP for enhanced cloud management capabilities
- **Shell confirmation**: Destructive shell commands require user confirmation
- **AWS tools**: Full access to AWS-specific operations for infrastructure management

### Benefits and Workflow Improvements

- **Reduced friction**: Read operations are automated, speeding up infrastructure analysis
- **Security first**: Destructive operations require explicit confirmation
- **AWS integration**: MCP server provides enhanced AWS-specific capabilities
- **Clear guidance**: System prompt establishes the agent as an infrastructure expert

### Usage

```bash
kiro chat --mode aws-infrastructure-agent "List all EC2 instances in the default VPC and their status"
kiro chat --mode aws-infrastructure-agent "Review this Terraform configuration for security issues"
kiro chat --mode aws-infrastructure-agent "Suggest cost optimization strategies for our RDS instances"
```

## Example 2: Code Review Agent

A read-only agent focused on code quality analysis without the ability to modify code.

### Use Case

This agent is designed for developers who want automated code reviews without the risk of accidental modifications. It's perfect for pull request reviews, security audits, and code quality assessments.

### Configuration

```json
{
  "name": "code-reviewer",
  "description": "A specialized agent for code review that focuses on code quality, best practices, and potential issues",
  "prompt": "You are a code review specialist. Your role is to:\n\n- Analyze code for potential bugs, security issues, and performance problems\n- Check adherence to coding standards and best practices\n- Suggest improvements for code readability and maintainability\n- Identify code smells and anti-patterns\n- Provide constructive feedback with specific examples\n- Verify proper error handling and edge case coverage\n- Assess code complexity and suggest simplifications\n\nYou can read code files but cannot modify them directly - your role is to review and provide feedback. Always explain your reasoning and provide actionable suggestions.",
  "mcpServers": {},
  "tools": ["read", "grep", "glob", "thinking", "report"],
  "toolAliases": {},
  "allowedTools": [
    "readFile",
    "readMultipleFiles",
    "readCode",
    "grepSearch",
    "fileSearch",
    "listDirectory"
  ],
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

### Key Settings Explained

- **Read-only access**: No write or shell tools, ensuring the agent cannot modify code
- **Pre-approved read tools**: All reading operations are automated for efficient reviews
- **Report tool**: Enables structured feedback generation
- **Focused tools**: Only includes tools necessary for code analysis

### Benefits and Workflow Improvements

- **Safe by design**: Cannot modify code, eliminating risk of accidental changes
- **Efficient reviews**: Automated file reading and searching speeds up the review process
- **Comprehensive analysis**: Can read multiple files and search across the codebase
- **Structured feedback**: Report tool enables organized review output

### Usage

```bash
kiro chat --mode code-reviewer "Review the authentication module for security vulnerabilities"
kiro chat --mode code-reviewer "Check this PR for code quality issues and best practice violations"
kiro chat --mode code-reviewer "Analyze the error handling in the payment processing code"
```

## Example 3: Debugging Agent

A full-access agent for debugging and fixing issues in code.

### Use Case

This agent is designed for developers who need help debugging issues. It has full access to read, write, and execute commands, making it powerful for reproducing and fixing bugs.

### Configuration

```json
{
  "name": "debugger-assistant",
  "description": "A specialized agent for debugging that helps identify and fix issues in code",
  "prompt": "You are a debugging specialist. Your role is to:\n\n- Analyze error messages and stack traces to identify root causes\n- Help reproduce issues with minimal test cases\n- Suggest debugging strategies and approaches\n- Identify potential fixes and workarounds\n- Explain complex debugging scenarios clearly\n- Use logging and diagnostic tools effectively\n- Verify fixes by running tests and checks\n\nYou have full access to read and write code, execute shell commands for testing, and use debugging tools. Always explain your debugging approach and verify fixes before considering them complete.",
  "mcpServers": {},
  "tools": ["read", "write", "shell", "grep", "glob", "thinking", "report", "introspect"],
  "toolAliases": {},
  "allowedTools": [],
  "resources": [],
  "hooks": {},
  "toolsSettings": {
    "write": {
      "confirmBeforeExecution": true
    },
    "shell": {
      "confirmBeforeExecution": true
    }
  },
  "includeMcpJson": true,
  "model": null
}
```

### Key Settings Explained

- **Full tool access**: Includes read, write, shell, and introspection tools
- **Confirmation for destructive operations**: Write and shell require user confirmation
- **Introspect tool**: Enables self-reflection during complex debugging scenarios
- **No pre-approvals**: All operations require confirmation for safety

### Benefits and Workflow Improvements

- **Comprehensive debugging**: Full access to all tools needed for debugging
- **Safety controls**: Destructive operations require confirmation
- **Self-reflection**: Introspect tool helps with complex debugging scenarios
- **Clear communication**: System prompt establishes debugging expertise

### Usage

```bash
kiro chat --mode debugger-assistant "The login function is failing with a null pointer error"
kiro chat --mode debugger-assistant "Help me debug why the API returns 500 errors intermittently"
kiro chat --mode debugger-assistant "Find and fix the memory leak in this service"
```

## Additional Example Ideas

Here are more custom agent ideas you can create:

### Documentation Writer Agent

A focused agent for creating and maintaining documentation with read and write access.

```json
{
  "name": "docs-writer",
  "description": "A specialized agent for writing and maintaining documentation",
  "prompt": "You are a documentation specialist. Create clear, comprehensive documentation.",
  "tools": ["read", "write", "grep", "glob", "thinking"],
  "allowedTools": ["readFile", "fsWrite", "grepSearch"]
}
```

### API Testing Agent

An agent focused on API testing with shell access for curl commands.

```json
{
  "name": "api-tester",
  "description": "A specialized agent for API testing and validation",
  "prompt": "You are an API testing specialist. Test endpoints and validate responses.",
  "tools": ["read", "shell", "grep", "thinking"],
  "allowedTools": ["readFile", "executeBash"]
}
```

### Database Agent

An agent with MCP integration for database operations.

```json
{
  "name": "database-admin",
  "description": "A specialized agent for database management",
  "prompt": "You are a database administrator. Help with queries and schema design.",
  "tools": ["read", "shell", "thinking", "@database"],
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"]
    }
  }
}
```

## Customizing Examples

You can adapt these examples for your specific needs:

### Adjusting Tool Access

Modify the `tools` array to include or exclude specific tool categories:

```json
{
  "tools": ["read", "write", "shell"]  // Full access
  "tools": ["read", "grep"]             // Read-only with search
  "tools": ["read", "write"]            // No shell access
}
```

### Adding Pre-Approvals

Add specific tools to `allowedTools` to automate safe operations:

```json
{
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch"]
}
```

### Configuring MCP Servers

Add MCP servers to extend capabilities:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

## Next Steps

Now that you've seen these examples, you can:

- [Create your own custom agent](./getting-started.md) based on these patterns
- [Explore configuration options](./configuration.md) in detail
- [Learn about tool access control](./tool-access.md) for security

Each example demonstrates different approaches to custom agent design. Choose the one that closest matches your needs and customize it for your specific use case.

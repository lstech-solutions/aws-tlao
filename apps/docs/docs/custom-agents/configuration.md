---
sidebar_position: 3
---

# Configuration Reference

This page provides a comprehensive reference for configuring custom agents in Kiro. You'll learn about the configuration file format, available options, and how to customize agent behavior for your specific needs.

## Configuration File Format

Custom agents are defined using JSON files. Each agent configuration is stored as a separate file in the `~/.kiro/agents/` directory.

### File Location

```
~/.kiro/agents/<agent-name>.json
```

For example:

- `~/.kiro/agents/docs-writer.json`
- `~/.kiro/agents/code-reviewer.json`
- `~/.kiro/agents/debugger-assistant.json`

### Basic Structure

Every custom agent configuration follows this JSON structure:

```json
{
  "name": "agent-name",
  "description": "Brief description of the agent's purpose",
  "prompt": "System prompt that defines the agent's behavior",
  "tools": ["read", "write", "shell"],
  "allowedTools": [],
  "mcpServers": {},
  "toolAliases": {},
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

## Core Configuration Options

### name (required)

The unique identifier for your agent. This is the name you'll use when invoking the agent via the CLI.

```json
{
  "name": "docs-writer"
}
```

**Usage**: `kiro chat --mode docs-writer "Create API documentation"`

**Rules**:

- Must be unique across all your custom agents
- Use lowercase with hyphens (kebab-case)
- Should be descriptive of the agent's purpose

### description (required)

A brief description of what the agent does. This helps you and your team understand the agent's purpose at a glance.

```json
{
  "description": "A specialized agent for writing and maintaining documentation"
}
```

**Best Practices**:

- Keep it concise (one sentence)
- Describe the agent's primary function
- Mention any special capabilities or focus areas

### prompt

The system prompt that defines your agent's behavior, personality, and instructions. This is the most important field for customizing how your agent works.

```json
{
  "prompt": "You are a documentation specialist. Focus on creating clear, comprehensive documentation with practical examples. Prioritize accuracy and completeness."
}
```

**Best Practices**:

- Be specific about the agent's role and responsibilities
- Include guidelines for how the agent should approach tasks
- Mention any constraints or preferences
- Use clear, direct language
- Can be multi-line for detailed instructions

**Example - Detailed Prompt**:

```json
{
  "prompt": "You are a code review specialist. Your role is to:\n\n- Analyze code for potential bugs and security issues\n- Check adherence to coding standards\n- Suggest improvements for readability\n- Provide constructive feedback with examples\n\nYou can read code files but cannot modify them - your role is to review and provide feedback."
}
```

## Tool Configuration

### tools

An array of tool categories or specific tools the agent can use. This controls what actions your agent can perform.

```json
{
  "tools": ["read", "write", "shell", "grep", "glob", "thinking"]
}
```

**Available Tool Categories**:

- **read** - File reading operations (readFile, readMultipleFiles, readCode)
- **write** - File writing and editing (fsWrite, fsAppend, strReplace, editCode)
- **shell** - Shell command execution (executeBash, controlBashProcess)
- **grep** - Text search operations (grepSearch)
- **glob** - File pattern matching (fileSearch, listDirectory)
- **thinking** - Internal reasoning and planning
- **report** - Progress reporting
- **introspect** - Self-reflection capabilities
- **knowledge** - Knowledge base access
- **todo** - Task management
- **delegate** - Subagent delegation
- **aws** - AWS-specific operations

**Best Practices**:

- Only include tools the agent actually needs
- Use minimal tool sets for specialized agents
- Consider security implications of write and shell access
- Start with read-only tools and add more as needed

**Example - Read-Only Agent**:

```json
{
  "tools": ["read", "grep", "glob", "thinking", "report"]
}
```

**Example - Full-Access Agent**:

```json
{
  "tools": ["read", "write", "shell", "grep", "glob", "thinking", "report"]
}
```

### allowedTools

An array of specific tool names that are pre-approved for use without user confirmation. This enables automation and reduces interruptions.

```json
{
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "fsWrite"]
}
```

**When to Use Pre-Approval**:

- Automating repetitive workflows
- Trusted operations that don't need confirmation
- Reducing interruptions for safe operations
- Creating specialized agents with specific permissions

**Security Considerations**:

- Only pre-approve tools you fully trust
- Be cautious with write and shell tools
- Consider the scope of operations
- Review agent behavior before adding pre-approvals
- Start with an empty array and add tools gradually

**Example - Safe Pre-Approvals**:

```json
{
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "listDirectory"]
}
```

### toolAliases

Custom names for tools (advanced feature). This allows you to create shortcuts or rename tools for your agent.

```json
{
  "toolAliases": {}
}
```

Most users can leave this as an empty object.

### toolsSettings

Tool-specific configuration settings (advanced feature). This allows you to customize how individual tools behave.

```json
{
  "toolsSettings": {}
}
```

Most users can leave this as an empty object.

## MCP Integration

### mcpServers

Configuration for Model Context Protocol (MCP) servers that extend your agent's capabilities with external tools.

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  }
}
```

**MCP Server Structure**:

- **command** - The command to run the MCP server
- **args** - Array of command-line arguments
- **env** - Environment variables for the server

**Using MCP Tools**:

Once configured, reference MCP tools in your `tools` array:

```json
{
  "tools": ["read", "write", "@database/query", "@database/schema"]
}
```

**MCP Tool Formats**:

- `@server_name/tool_name` - Include a specific tool from the MCP server
- `@server_name` - Include all tools from the MCP server

**Example - Database Agent with MCP**:

```json
{
  "name": "database-admin",
  "description": "Database administration agent with SQL capabilities",
  "prompt": "You are a database administrator. Help with queries, schema design, and optimization.",
  "tools": ["read", "thinking", "@database"],
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  }
}
```

### includeMcpJson

Whether to include MCP server definitions from the global MCP configuration.

```json
{
  "includeMcpJson": true
}
```

**Values**:

- `true` - Include global MCP servers (default)
- `false` - Only use MCP servers defined in this agent

## Advanced Configuration

### resources

Additional resources the agent can access (advanced feature).

```json
{
  "resources": []
}
```

Most users can leave this as an empty array.

### hooks

Event hooks for automation (advanced feature). This allows you to trigger actions based on events.

```json
{
  "hooks": {}
}
```

Most users can leave this as an empty object.

### model

Specific AI model to use for this agent. Set to `null` to use the default model.

```json
{
  "model": null
}
```

**When to Specify a Model**:

- Testing different models for specific tasks
- Using a faster model for simple operations
- Using a more capable model for complex reasoning

**Example**:

```json
{
  "model": "claude-3-5-sonnet-20241022"
}
```

## Configuration Examples

### Example 1: Documentation Writer

A specialized agent for creating and maintaining documentation.

```json
{
  "name": "docs-writer",
  "description": "A specialized agent for writing and maintaining documentation with focus on clarity and completeness",
  "prompt": "You are a documentation specialist. Your primary focus is on creating clear, comprehensive, and well-structured documentation. When writing documentation:\n\n- Use clear, concise language that's accessible to the target audience\n- Organize content with proper headings and structure\n- Include practical examples and code snippets where appropriate\n- Follow documentation best practices and style guides\n- Ensure consistency in terminology and formatting\n- Cross-reference related documentation sections\n- Prioritize accuracy and completeness\n\nYou have access to file reading and writing tools to create and update documentation files.",
  "mcpServers": {},
  "tools": ["read", "write", "grep", "glob", "thinking"],
  "toolAliases": {},
  "allowedTools": [],
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

**Key Features**:

- Limited tool access for focused documentation work
- Custom system prompt emphasizing documentation best practices
- No pre-approved tools (requires user confirmation)

**Usage**:

```bash
kiro chat --mode docs-writer "Add API documentation for the user authentication endpoints"
```

### Example 2: Code Review Agent

A specialized agent for reviewing code without modifying it.

```json
{
  "name": "code-reviewer",
  "description": "A specialized agent for code review that focuses on code quality, best practices, and potential issues",
  "prompt": "You are a code review specialist. Your role is to:\n\n- Analyze code for potential bugs, security issues, and performance problems\n- Check adherence to coding standards and best practices\n- Suggest improvements for code readability and maintainability\n- Identify code smells and anti-patterns\n- Provide constructive feedback with specific examples\n- Verify proper error handling and edge case coverage\n\nYou can read code files but cannot modify them directly - your role is to review and provide feedback.",
  "mcpServers": {},
  "tools": ["read", "grep", "glob", "thinking", "report"],
  "toolAliases": {},
  "allowedTools": [],
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

**Key Features**:

- Read-only tool access for safe code review
- System prompt focused on code quality
- Includes report tool for structured feedback

**Usage**:

```bash
kiro chat --mode code-reviewer "Review the authentication module for security issues"
```

### Example 3: Minimal Configuration

The simplest possible custom agent configuration.

```json
{
  "name": "simple-assistant",
  "description": "A simple general-purpose assistant",
  "prompt": "You are a helpful assistant.",
  "tools": ["read", "write", "thinking"],
  "allowedTools": [],
  "mcpServers": {},
  "toolAliases": {},
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

### Example 4: Agent with Pre-Approved Tools

An agent with automated file reading operations.

```json
{
  "name": "auto-reader",
  "description": "Agent with pre-approved read operations",
  "prompt": "You are a code analysis assistant. Read and analyze code files to provide insights.",
  "tools": ["read", "grep", "glob", "thinking"],
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "listDirectory"],
  "mcpServers": {},
  "toolAliases": {},
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

## Configuration Validation

### Validating Your Configuration

Before using a custom agent, validate that your configuration file is correct:

**1. Check JSON Syntax**:

```bash
cat ~/.kiro/agents/your-agent.json | jq .
```

If the JSON is valid, you'll see formatted output. If there are syntax errors, `jq` will report them.

**2. Verify File Location**:

```bash
ls -la ~/.kiro/agents/
```

Ensure your `.json` file is in the correct directory.

**3. Test the Agent**:

```bash
kiro chat --mode your-agent "Hello, can you introduce yourself?"
```

### Common Configuration Errors

**Invalid JSON Syntax**:

```json
{
  "name": "my-agent",
  "tools": ["read", "write"] // ❌ Trailing comma
}
```

**Missing Required Fields**:

```json
{
  "description": "My agent" // ❌ Missing "name" field
}
```

**Invalid Tool Names**:

```json
{
  "tools": ["read", "invalid-tool"] // ❌ "invalid-tool" doesn't exist
}
```

**Incorrect MCP Format**:

```json
{
  "mcpServers": {
    "database": "npx @modelcontextprotocol/server-postgres" // ❌ Should be an object
  }
}
```

### Troubleshooting

**Agent Not Found**:

- Verify the file is in `~/.kiro/agents/`
- Check the file has a `.json` extension
- Ensure the filename matches the agent name

**Tool Access Errors**:

- Verify tool names in the `tools` array are correct
- Check that tool categories are spelled correctly
- Ensure MCP server references use the `@server_name` format

**MCP Server Errors**:

- Verify the MCP server command is correct
- Check that required dependencies are installed
- Ensure environment variables are properly set

## Next Steps

Now that you understand configuration options, you can:

- Learn about [Tool Access Control](./tool-access.md) for managing permissions
- Explore [Real-World Examples](./examples.md) for inspiration
- Create your own custom agents for your workflows

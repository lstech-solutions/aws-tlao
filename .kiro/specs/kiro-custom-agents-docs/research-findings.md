# Kiro Custom Agents - Research Findings

## Overview

This document captures the actual configuration format, CLI commands, and behavior of Kiro custom agents based on hands-on testing and exploration.

## Configuration File Location

Custom agent configuration files are stored in:

```
~/.kiro/agents/
```

Each agent is defined in a separate JSON file with the naming pattern:

```
<agent-name>.json
```

For example:

- `~/.kiro/agents/docs-writer.json`
- `~/.kiro/agents/code-reviewer.json`
- `~/.kiro/agents/debugger-assistant.json`

## Configuration File Format

Custom agents use JSON format with the following structure:

```json
{
  "name": "agent-name",
  "description": "Brief description of the agent's purpose",
  "prompt": "System prompt that defines the agent's behavior and instructions",
  "mcpServers": {},
  "tools": [
    "read",
    "write",
    "shell",
    "grep",
    "glob",
    "thinking",
    "report",
    "introspect",
    "knowledge",
    "todo",
    "delegate",
    "aws"
  ],
  "toolAliases": {},
  "allowedTools": [],
  "resources": [],
  "hooks": {},
  "toolsSettings": {},
  "includeMcpJson": true,
  "model": null
}
```

### Configuration Fields

#### Required Fields

- **name** (string): The identifier for the agent, used when invoking it via CLI
- **description** (string): A brief description of what the agent does

#### Core Configuration

- **prompt** (string | null): The system prompt that defines the agent's behavior, personality, and instructions. This is the primary way to customize agent behavior.

#### Tool Configuration

- **tools** (array): List of tool categories or specific tools the agent can use. Available built-in tools include:
  - `read` - File reading tools
  - `write` - File writing and editing tools
  - `shell` - Shell command execution
  - `grep` - Text search tools
  - `glob` - File pattern matching
  - `thinking` - Internal reasoning tools
  - `report` - Progress reporting
  - `introspect` - Self-reflection capabilities
  - `knowledge` - Knowledge base access
  - `todo` - Task management
  - `delegate` - Subagent delegation
  - `aws` - AWS-specific tools

- **allowedTools** (array): Specific tools that are pre-approved for use without user confirmation. Empty array means no pre-approval.

- **toolAliases** (object): Custom names for tools (advanced feature)

- **toolsSettings** (object): Tool-specific configuration settings

#### MCP Integration

- **mcpServers** (object): Configuration for Model Context Protocol servers that extend agent capabilities with external tools. Format:

  ```json
  {
    "server-name": {
      "command": "path/to/server",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
  ```

- **includeMcpJson** (boolean): Whether to include MCP server definitions from the global MCP configuration

#### Advanced Configuration

- **resources** (array): Additional resources the agent can access

- **hooks** (object): Event hooks for automation

- **model** (string | null): Specific AI model to use (null uses default)

## CLI Commands

### Invoking a Custom Agent

To use a custom agent, use the `kiro chat` command with the `--mode` option:

```bash
kiro chat --mode <agent-name> "<your prompt>"
```

Examples:

```bash
# Use the docs-writer agent
kiro chat --mode docs-writer "Create documentation for the API endpoints"

# Use the code-reviewer agent
kiro chat --mode code-reviewer "Review the authentication module"

# Use the debugger-assistant agent
kiro chat --mode debugger-assistant "Help me debug the login failure"
```

### CLI Options

- `--mode <mode>`: Specify the agent to use (defaults to 'agent')
  - Built-in modes: 'ask', 'edit', 'agent'
  - Custom agents: Use the agent name from the configuration file

- `--add-file <path>`: Add specific files as context to the chat session

- `--maximize`: Maximize the chat session view

- `--reuse-window`: Use the last active window for the chat session

- `--new-window`: Open a new window for the chat session

- `--profile <profileName>`: Use a specific profile

### Adding MCP Servers

To add a Model Context Protocol server globally:

```bash
kiro --add-mcp '{"name":"server-name","command":"path/to/server","args":["arg1"]}'
```

## Example Configurations

### Example 1: Documentation Writer Agent

**Purpose**: Specialized agent for creating and maintaining documentation

**File**: `~/.kiro/agents/docs-writer.json`

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

- Limited tool access (read, write, grep, glob, thinking) for focused documentation work
- Custom system prompt emphasizing documentation best practices
- No pre-approved tools (requires user confirmation for actions)

**Usage**:

```bash
kiro chat --mode docs-writer "Add API documentation for the user authentication endpoints"
```

### Example 2: Code Review Agent

**Purpose**: Specialized agent for reviewing code without modifying it

**File**: `~/.kiro/agents/code-reviewer.json`

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

- Read-only tool access (no write or shell tools) for safe code review
- System prompt focused on code quality and best practices
- Includes report tool for structured feedback

**Usage**:

```bash
kiro chat --mode code-reviewer "Review the authentication module for security issues"
```

### Example 3: Debugger Assistant Agent

**Purpose**: Specialized agent for debugging with full tool access

**File**: `~/.kiro/agents/debugger-assistant.json`

```json
{
  "name": "debugger-assistant",
  "description": "A specialized agent for debugging that helps identify and fix issues in code",
  "prompt": "You are a debugging specialist. Your role is to:\n\n- Analyze error messages and stack traces to identify root causes\n- Suggest debugging strategies and approaches\n- Help reproduce issues with minimal test cases\n- Identify potential fixes and workarounds\n- Explain complex debugging scenarios clearly\n- Use logging and diagnostic tools effectively\n\nYou have full access to read and write code, execute shell commands for testing, and use debugging tools.",
  "mcpServers": {},
  "tools": ["read", "write", "shell", "grep", "glob", "thinking", "report", "introspect"],
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

- Full tool access including write and shell for debugging and fixing
- System prompt focused on debugging methodology
- Includes introspect tool for self-reflection during complex debugging

**Usage**:

```bash
kiro chat --mode debugger-assistant "The login function is failing with a null pointer error"
```

## Tool Access Control

### Tool Categories

Tools are organized into categories that can be included or excluded:

- **read**: File reading operations (readFile, readMultipleFiles, readCode, etc.)
- **write**: File writing operations (fsWrite, fsAppend, strReplace, editCode, etc.)
- **shell**: Shell command execution (executeBash, controlBashProcess, etc.)
- **grep**: Text search operations (grepSearch)
- **glob**: File pattern matching (fileSearch, listDirectory)
- **thinking**: Internal reasoning and planning
- **report**: Progress reporting
- **introspect**: Self-reflection capabilities
- **knowledge**: Knowledge base access
- **todo**: Task management
- **delegate**: Subagent delegation
- **aws**: AWS-specific operations

### Pre-Approval Feature

The `allowedTools` array can be used to pre-approve specific tools, allowing the agent to use them without user confirmation. This is useful for:

- Automating repetitive workflows
- Reducing interruptions for trusted operations
- Creating specialized agents with specific permissions

**Security Considerations**:

- Only pre-approve tools you fully trust
- Be cautious with write and shell tools
- Consider the scope of operations the agent will perform
- Review agent behavior before adding pre-approvals

**Example with Pre-Approval**:

```json
{
  "name": "safe-docs-writer",
  "tools": ["read", "write", "grep"],
  "allowedTools": ["readFile", "readMultipleFiles", "grepSearch", "fsWrite"]
}
```

## MCP Server Integration

Custom agents can integrate with Model Context Protocol (MCP) servers to extend their capabilities with external tools.

### MCP Server Configuration

Add MCP servers in the `mcpServers` field:

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

### Using MCP Tools

Once configured, MCP tools can be referenced in the `tools` array:

```json
{
  "tools": ["read", "write", "@database/query", "@database/schema", "@database"]
}
```

Formats:

- `@server_name/tool_name` - Include a specific tool from the MCP server
- `@server_name` - Include all tools from the MCP server

## Verification and Testing

### Verifying Agent Configuration

1. Check that the JSON file is valid:

   ```bash
   cat ~/.kiro/agents/your-agent.json | jq .
   ```

2. Verify the file is in the correct location:

   ```bash
   ls -la ~/.kiro/agents/
   ```

3. Test the agent with a simple prompt:
   ```bash
   kiro chat --mode your-agent "Hello, can you introduce yourself?"
   ```

### Common Issues

1. **Agent not found**: Ensure the JSON file is in `~/.kiro/agents/` and has a `.json` extension

2. **Invalid JSON**: Use `jq` to validate JSON syntax

3. **Tool access errors**: Verify tool names in the `tools` array match available tool categories

4. **MCP server errors**: Check that MCP server commands are correct and dependencies are installed

## Best Practices

1. **Start Simple**: Begin with basic tool configurations and add complexity as needed

2. **Clear System Prompts**: Write detailed system prompts that clearly define the agent's role and behavior

3. **Tool Minimalism**: Only include tools the agent actually needs for its specific purpose

4. **Security First**: Be cautious with pre-approved tools, especially write and shell access

5. **Descriptive Names**: Use clear, descriptive names for agents that indicate their purpose

6. **Documentation**: Document your custom agents and their intended use cases

7. **Testing**: Test agents with various prompts to ensure they behave as expected

8. **Version Control**: Consider storing agent configurations in version control for team sharing

## Next Steps

With this research complete, we can now:

1. Create accurate documentation pages based on the actual configuration format
2. Provide real, tested examples in the documentation
3. Document the exact CLI commands users need
4. Explain tool access control with concrete examples
5. Show MCP integration with the correct syntax

## Files Created During Testing

- `~/.kiro/agents/docs-writer.json` - Documentation specialist agent
- `~/.kiro/agents/code-reviewer.json` - Code review agent
- `~/.kiro/agents/debugger-assistant.json` - Debugging assistant agent
- `test-agent-sample.md` - Test file for agent verification

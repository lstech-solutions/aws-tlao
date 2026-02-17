# Kiro Custom Agent Configuration Reference

## Quick Reference

### File Location

```
~/.kiro/agents/<agent-name>.json
```

### Basic Structure

```json
{
  "name": "agent-name",
  "description": "Agent description",
  "prompt": "System prompt defining behavior",
  "tools": ["read", "write", "shell", "grep", "glob"],
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

### CLI Usage

```bash
kiro chat --mode <agent-name> "<prompt>"
```

## Available Tool Categories

- `read` - File reading operations
- `write` - File writing and editing
- `shell` - Shell command execution
- `grep` - Text search
- `glob` - File pattern matching
- `thinking` - Internal reasoning
- `report` - Progress reporting
- `introspect` - Self-reflection
- `knowledge` - Knowledge base access
- `todo` - Task management
- `delegate` - Subagent delegation
- `aws` - AWS-specific tools

## MCP Server Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

## MCP Tool References

- `@server_name/tool_name` - Specific tool
- `@server_name` - All tools from server

## Pre-Approval

Add tool names to `allowedTools` array for automatic approval:

```json
{
  "allowedTools": ["readFile", "grepSearch", "fsWrite"]
}
```

## Example Agents Created

1. **docs-writer** - Documentation specialist (read, write, grep, glob, thinking)
2. **code-reviewer** - Code review (read, grep, glob, thinking, report)
3. **debugger-assistant** - Debugging (read, write, shell, grep, glob, thinking, report, introspect)

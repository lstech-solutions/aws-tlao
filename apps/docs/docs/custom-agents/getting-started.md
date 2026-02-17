---
sidebar_position: 2
---

# Getting Started with Custom Agents

This guide will walk you through creating your first custom agent in Kiro. By the end, you'll have a working custom agent tailored to your specific workflow.

## Prerequisites

Before creating a custom agent, ensure you have:

- **Kiro CLI installed**: Custom agents are configured and invoked through the Kiro command-line interface
- **Basic JSON knowledge**: Agent configurations are written in JSON format
- **A text editor**: Any editor will work for creating configuration files

## Creating Your First Custom Agent

### Step 1: Create the Agents Directory

Custom agent configurations are stored in the `~/.kiro/agents/` directory. Create this directory if it doesn't exist:

```bash
mkdir -p ~/.kiro/agents
```

### Step 2: Create a Configuration File

Create a new JSON file for your agent. The filename should match your agent's name. For example, to create a documentation writer agent:

```bash
touch ~/.kiro/agents/docs-writer.json
```

### Step 3: Define the Basic Configuration

Open the file in your text editor and add the basic configuration structure:

```json
{
  "name": "docs-writer",
  "description": "A specialized agent for writing and maintaining documentation",
  "prompt": "You are a documentation specialist focused on creating clear, comprehensive documentation.",
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

Let's break down each field:

- **name**: The identifier used to invoke the agent (must match the filename without `.json`)
- **description**: A brief explanation of what the agent does
- **prompt**: The system prompt that defines the agent's behavior and personality
- **tools**: Array of tool categories the agent can use (read, write, shell, grep, glob, thinking, report, etc.)
- **allowedTools**: Tools that are pre-approved without user confirmation (empty for now)
- **mcpServers**: Configuration for external MCP servers (empty for basic agents)
- **model**: Specific AI model to use (null uses the default)

### Step 4: Customize the System Prompt

The `prompt` field is where you define your agent's personality and behavior. Make it specific to your use case:

```json
{
  "prompt": "You are a documentation specialist. Your primary focus is on creating clear, comprehensive, and well-structured documentation. When writing documentation:\n\n- Use clear, concise language that's accessible to the target audience\n- Organize content with proper headings and structure\n- Include practical examples and code snippets where appropriate\n- Follow documentation best practices and style guides\n- Ensure consistency in terminology and formatting\n\nYou have access to file reading and writing tools to create and update documentation files."
}
```

### Step 5: Configure Tool Access

Choose which tool categories your agent needs. Common tool categories include:

- **read**: File reading operations (readFile, readCode, etc.)
- **write**: File writing and editing operations (fsWrite, editCode, etc.)
- **shell**: Shell command execution
- **grep**: Text search operations
- **glob**: File pattern matching and directory listing
- **thinking**: Internal reasoning capabilities
- **report**: Progress reporting
- **delegate**: Subagent delegation

For a documentation writer, you might want:

```json
{
  "tools": ["read", "write", "grep", "glob", "thinking"]
}
```

### Step 6: Validate Your Configuration

Before using your agent, validate that the JSON is properly formatted:

```bash
cat ~/.kiro/agents/docs-writer.json | jq .
```

If the command outputs your configuration without errors, the JSON is valid.

## Running Your Custom Agent

### Basic Usage

To use your custom agent, use the `kiro chat` command with the `--mode` option:

```bash
kiro chat --mode docs-writer "Create documentation for the authentication module"
```

The agent will start a chat session using your custom configuration.

### Adding Context Files

You can add specific files as context to help the agent understand your codebase:

```bash
kiro chat --mode docs-writer --add-file src/auth.ts "Document the authentication functions"
```

### Common CLI Options

- `--mode <agent-name>`: Specify which custom agent to use
- `--add-file <path>`: Add specific files as context
- `--maximize`: Maximize the chat session view
- `--new-window`: Open a new window for the chat session

## Verifying Your Agent Works

### Test 1: Introduction

Ask your agent to introduce itself:

```bash
kiro chat --mode docs-writer "Hello, can you introduce yourself and explain what you do?"
```

The agent should respond according to the system prompt you defined.

### Test 2: Tool Access

Test that the agent has the correct tool access by asking it to perform a task:

```bash
kiro chat --mode docs-writer "List the markdown files in the docs directory"
```

If the agent can read files and search directories, your tool configuration is working.

### Test 3: Behavior

Verify the agent follows the behavior defined in your system prompt:

```bash
kiro chat --mode docs-writer "Explain how you approach writing documentation"
```

The response should reflect the guidelines you specified in the prompt.

## Troubleshooting

### Agent Not Found

**Problem**: Error message "Agent not found" or "Unknown mode"

**Solutions**:

- Verify the file is in `~/.kiro/agents/` directory
- Check that the filename matches the agent name with `.json` extension
- Ensure the `name` field in the JSON matches the filename (without `.json`)

```bash
# Check if file exists
ls -la ~/.kiro/agents/docs-writer.json

# Verify the name field matches
cat ~/.kiro/agents/docs-writer.json | jq .name
```

### Invalid JSON Syntax

**Problem**: Agent fails to load or shows JSON parsing errors

**Solutions**:

- Use `jq` to validate and format your JSON:
  ```bash
  cat ~/.kiro/agents/docs-writer.json | jq .
  ```
- Check for common JSON errors:
  - Missing commas between fields
  - Trailing commas after the last field
  - Unescaped quotes in strings (use `\n` for newlines)
  - Mismatched brackets or braces

### Tool Access Errors

**Problem**: Agent says it cannot perform certain actions

**Solutions**:

- Verify the required tool category is in the `tools` array
- Check that tool names are spelled correctly
- Common tool categories: `read`, `write`, `shell`, `grep`, `glob`, `thinking`, `report`, `delegate`

### Agent Behavior Not as Expected

**Problem**: Agent doesn't follow the instructions in your system prompt

**Solutions**:

- Make your system prompt more specific and detailed
- Use clear, direct language in the prompt
- Include examples of desired behavior
- Test with different prompts to refine the agent's responses

## Next Steps

Now that you have a working custom agent, you can:

- **[Learn about configuration options](./configuration.md)**: Explore advanced configuration features
- **[Configure tool access control](./tool-access.md)**: Set up pre-approved tools and security settings
- **[See more examples](./examples.md)**: Review real-world custom agent configurations

You can also create multiple custom agents for different workflows:

- Code review agent (read-only access)
- Debugging assistant (full tool access)
- Infrastructure agent (with AWS or cloud tools)
- Testing agent (focused on test creation and execution)

Each agent can be optimized for its specific purpose, making your development workflow more efficient.

---
sidebar_position: 1
---

# Custom Agents

## What are Custom Agents?

Custom agents are specialized configurations of Kiro that let you tailor its behavior for specific workflows and tasks. Think of them as different "modes" of Kiro, each optimized for a particular type of work—whether that's writing documentation, reviewing code, debugging issues, or managing infrastructure.

Each custom agent has its own system prompt, tool access permissions, and configuration settings. This means you can create an agent that's laser-focused on documentation work with only the tools it needs, or a debugging agent with full access to execute commands and modify code.

## Why Use Custom Agents?

Custom agents transform how you work with Kiro by adapting the AI assistant to your specific needs rather than using a one-size-fits-all approach. Here are the key benefits:

### Workflow Optimization

Custom agents are designed for specific tasks, which means they understand the context and constraints of your work. A documentation agent knows to prioritize clarity and structure, while a code review agent focuses on quality and best practices. This specialization leads to better, more relevant assistance.

### Reduced Interruptions

By configuring tool access and pre-approval settings, you can reduce the number of confirmation prompts for trusted operations. If you're running a documentation workflow that frequently reads and writes markdown files, you can pre-approve those tools so the agent works more smoothly without constant interruptions.

### Enhanced Context

Each custom agent can have a detailed system prompt that provides domain-specific knowledge and guidelines. This means the agent starts every conversation with the right context—whether that's your team's coding standards, documentation style guide, or debugging methodology.

### Team Collaboration

Custom agent configurations are just JSON files, which means they can be shared with your team through version control. Everyone can use the same specialized agents, ensuring consistent workflows and approaches across the team.

### Security Control

Fine-grained tool access control lets you create agents with exactly the permissions they need. A code review agent might only have read access to files, while a debugging agent has full access to read, write, and execute commands. This principle of least privilege helps maintain security while enabling powerful automation.

## How Custom Agents Relate to Kiro CLI

Custom agents work seamlessly with the Kiro CLI. You create agent configurations as JSON files in `~/.kiro/agents/`, and then invoke them using the `--mode` flag:

```bash
kiro chat --mode docs-writer "Create API documentation"
kiro chat --mode code-reviewer "Review the authentication module"
kiro chat --mode debugger-assistant "Debug the login failure"
```

Each agent has access to Kiro's built-in tools (like file operations, shell commands, and code analysis) as well as any Model Context Protocol (MCP) servers you've configured. You control which tools each agent can use and which operations require confirmation.

## When to Use Custom Agents

Custom agents are particularly valuable when you:

- **Have repetitive workflows**: If you frequently perform the same type of task (like writing docs or reviewing PRs), a custom agent can streamline that workflow
- **Need specialized behavior**: When you want Kiro to follow specific guidelines or approaches for certain types of work
- **Want to reduce friction**: Pre-approving trusted tools for specific workflows reduces interruptions and speeds up your work
- **Work in a team**: Sharing agent configurations ensures everyone has access to the same optimized workflows
- **Need security boundaries**: When you want to limit what operations an agent can perform for safety or compliance reasons

You don't need custom agents for every task—the default Kiro agent is great for general-purpose work. But when you find yourself repeatedly doing the same type of work or wishing Kiro behaved differently for specific tasks, that's a perfect opportunity to create a custom agent.

## Next Steps

Ready to create your first custom agent? Here's where to go next:

- **[Getting Started](./getting-started.md)**: Step-by-step guide to creating your first custom agent
- **[Configuration Reference](./configuration.md)**: Complete documentation of all configuration options
- **[Tool Access Control](./tool-access.md)**: Learn about tool permissions and pre-approval
- **[Examples](./examples.md)**: Real-world custom agent configurations you can adapt

Start with the Getting Started guide to create a simple custom agent, then explore the other pages to unlock more advanced features.

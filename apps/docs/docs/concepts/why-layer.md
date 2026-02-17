---
sidebar_position: 1
---

# Why "Layer"?

TLÁO is called a **Layer** because it sits between two fundamentally different worlds: the messy, unstructured reality of how information arrives, and the precise, structured world of execution systems.

## The Problem: Two Incompatible Worlds

### Unstructured Reality

Information in the real world arrives in countless formats:

- **Emails**: Requests buried in conversation threads
- **PDFs**: Grant applications, invoices, contracts
- **Meeting Notes**: Scattered action items and decisions
- **Transcripts**: Recorded conversations with implicit tasks
- **Web Pages**: Grant opportunities, requirements, deadlines
- **Invoices**: Payment requests with varying formats
- **Slack/Teams Messages**: Quick asks and updates

Each source has its own structure (or lack thereof), terminology, and context. There's no standard format, no consistent fields, no unified schema.

### Execution Systems

Meanwhile, the systems that actually execute work require precise, structured inputs:

- **GitHub Issues**: Title, description, labels, assignees, milestones
- **Calendars**: Event name, time, location, attendees
- **Notion/Jira**: Structured tasks with fields, statuses, relationships
- **Proposal Documents**: Formatted sections with specific requirements
- **Budget Spreadsheets**: Line items, amounts, categories
- **Deployment Systems**: Configuration files, environment variables, commands

These systems can't directly consume unstructured inputs. They need clean, structured data.

## The Solution: A Tactical Layer

TLÁO acts as the **middleware layer** that bridges this gap:

```
┌─────────────────────────────────────┐
│     Unstructured Reality            │
│  (Emails, PDFs, Notes, Transcripts) │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│            TLÁO LAYER               │
│  • Unified Ingestion                │
│  • Structured Extraction            │
│  • Tactical Reasoning               │
│  • Action Interface                 │
│  • Orchestration                    │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│       Execution Systems             │
│  (GitHub, Calendars, Notion, etc.)  │
└─────────────────────────────────────┘
```

## What Makes It a Layer?

A layer in software architecture has specific characteristics:

1. **Abstraction**: Hides complexity from both sides
2. **Translation**: Converts between different formats and protocols
3. **Independence**: Can be added or removed without changing the systems above or below
4. **Standardization**: Provides a consistent interface regardless of input or output variety

TLÁO embodies all of these:

- **Abstracts** the chaos of unstructured inputs
- **Translates** between natural language and structured data
- **Operates independently** of specific input sources or execution systems
- **Standardizes** the process of going from information to action

## The Five Sub-Layers

TLÁO itself is composed of five distinct layers, each handling a specific aspect of the transformation:

1. **Layer 0: Identity & Workspace** - Who and where
2. **Layer 1: Intake** - Unified ingestion of messy inputs
3. **Layer 2: Understanding** - Structured extraction
4. **Layer 3: Tactical Reasoning** - Planning and decision-making
5. **Layer 4: Action Interface** - Turning outputs into real actions
6. **Layer 5: Orchestration** - Managing runs, logs, and history

## Why This Matters

Without a tactical layer, you're forced to:

- **Manually translate** every email into a task
- **Copy-paste** information between systems
- **Remember** what needs to happen next
- **Track** progress across disconnected tools
- **Lose context** as information moves between systems

With TLÁO, the layer handles all of this automatically, letting you focus on the actual work instead of the translation between systems.

## Next Steps

- Learn about [Why "Tactical"?](why-tactical) - Understanding the time horizon
- Explore [Action & Outcomes](action-outcomes) - What TLÁO produces

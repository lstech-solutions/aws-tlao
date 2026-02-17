---
sidebar_position: 3
---

# Action & Outcomes

The "A" and "O" in TLÁO stand for **Action & Outcomes**—the concrete, measurable results that TLÁO produces. Understanding what TLÁO outputs is key to understanding its value.

## What is an Action?

An **Action** in TLÁO is a specific, executable task with clear parameters:

### Core Action Properties

Every action includes:

1. **Task Description**: What needs to be done
2. **Owner/Assignee**: Who is responsible
3. **Deadline**: When it needs to be completed
4. **Priority**: How urgent or important it is
5. **Dependencies**: What must happen first
6. **Context**: Why this matters and relevant background

### Action Example

```json
{
  "task": "Draft grant proposal narrative section",
  "owner": "Sarah Chen",
  "deadline": "2024-03-15",
  "priority": "high",
  "dependencies": ["Budget approval", "Project timeline finalized"],
  "context": "NSF grant deadline is March 20. Narrative must align with approved budget.",
  "estimatedHours": 8,
  "tags": ["grant", "writing", "deadline-critical"]
}
```

## What is an Outcome?

An **Outcome** is the result of completing an action—the measurable change in state:

### Outcome Types

1. **Deliverable Created**: Document, code, design, etc.
2. **Decision Made**: Approval granted, option selected, direction chosen
3. **Information Gathered**: Research completed, data collected, requirements clarified
4. **Communication Sent**: Email sent, meeting held, update posted
5. **System Updated**: Issue created, calendar event added, status changed

### Outcome Example

```json
{
  "action_id": "draft-grant-narrative",
  "status": "completed",
  "completedDate": "2024-03-14",
  "completedBy": "Sarah Chen",
  "deliverable": {
    "type": "document",
    "location": "docs/grants/nsf-2024-narrative.pdf",
    "wordCount": 3500
  },
  "notes": "Narrative complete and reviewed by PI. Ready for submission.",
  "nextActions": ["Submit grant application", "Notify finance team"]
}
```

## The Action-Outcome Cycle

TLÁO manages the complete lifecycle:

```
Input (Unstructured)
    │
    ▼
┌─────────────────────┐
│  TLÁO Processing    │
└─────────────────────┘
    │
    ▼
Actions (Structured)
    │
    ├─→ Task 1 → Outcome 1 → New Actions
    ├─→ Task 2 → Outcome 2 → New Actions
    └─→ Task 3 → Outcome 3 → New Actions
```

Each outcome can trigger new actions, creating a continuous flow from information to execution.

## Real-World Examples

### Example 1: Email to Actions

**Input**: Email about upcoming conference

**Actions Generated**:

- Submit conference talk proposal (deadline: 2 weeks)
- Book travel and accommodation (deadline: 1 week)
- Prepare presentation slides (deadline: 1 day before)
- Notify team of absence dates (deadline: this week)

**Outcomes Tracked**:

- ✅ Proposal submitted (March 1)
- ✅ Flights booked (March 3)
- ⏳ Slides in progress (due March 14)
- ✅ Team notified (March 2)

### Example 2: Grant PDF to Actions

**Input**: 50-page grant opportunity PDF

**Actions Generated**:

- Verify eligibility requirements (owner: PI, deadline: today)
- Gather required documents (owner: Admin, deadline: 3 days)
- Draft budget (owner: Finance, deadline: 1 week)
- Write project narrative (owner: Research Lead, deadline: 10 days)
- Get institutional approval (owner: PI, deadline: 12 days)
- Submit application (owner: Admin, deadline: 14 days)

**Outcomes Tracked**:

- ✅ Eligibility confirmed (eligible for $500K)
- ✅ Documents gathered (CVs, letters, certifications)
- ✅ Budget drafted ($487K total)
- ⏳ Narrative in progress (60% complete)
- ⏳ Approval pending (submitted to review board)
- ⏳ Submission pending (awaiting approval)

### Example 3: Meeting Notes to Actions

**Input**: Transcript of project planning meeting

**Actions Generated**:

- Update project timeline in Notion (owner: PM, deadline: today)
- Create design tasks (owner: Design Lead, deadline: tomorrow)
- Schedule architecture review (owner: Tech Lead, deadline: this week)
- Document technical decisions (owner: Tech Lead, deadline: 2 days)
- Send meeting summary to stakeholders (owner: PM, deadline: today)

**Outcomes Tracked**:

- ✅ Timeline updated (added 3 new milestones)
- ✅ 8 design tasks created and assigned
- ✅ Architecture review scheduled (March 10, 2pm)
- ✅ Decisions documented in wiki
- ✅ Summary sent to 12 stakeholders

## Action Properties in Detail

### Task Description

Clear, specific, actionable:

- ❌ "Work on the grant" (vague)
- ✅ "Draft the 2-page project summary for NSF grant" (specific)

### Owner/Assignee

Who is responsible:

- Can be a person: "Sarah Chen"
- Can be a role: "Project Manager"
- Can be a team: "Design Team"
- Can be unassigned: "TBD" (but should be assigned soon)

### Deadline

When it's due:

- Absolute: "2024-03-15"
- Relative: "3 days from now"
- Contextual: "Before the grant deadline"
- Flexible: "End of week (not critical)"

### Priority

How urgent/important:

- **Critical**: Blocking other work, imminent deadline
- **High**: Important, near-term deadline
- **Medium**: Should be done soon
- **Low**: Nice to have, flexible timing

### Dependencies

What must happen first:

- Other actions: "Requires budget approval"
- External events: "After client meeting"
- Information: "Once requirements are clarified"
- Resources: "When designer is available"

### Context

Why this matters:

- Background information
- Related documents or links
- Relevant conversations
- Strategic importance
- Risks or constraints

## Outcome Properties in Detail

### Status

Current state:

- **Not Started**: Action created but not begun
- **In Progress**: Work has started
- **Blocked**: Waiting on dependency
- **Completed**: Successfully finished
- **Cancelled**: No longer needed

### Deliverable

What was produced:

- Document with location
- Code with repository link
- Decision with rationale
- Communication with recipients
- System update with details

### Next Actions

What comes next:

- Follow-up tasks
- Dependent actions now unblocked
- New information that triggers new actions

## Integration with Execution Systems

TLÁO actions map directly to execution systems:

### GitHub Issues

```
Action → GitHub Issue
- Task → Issue title
- Context → Issue description
- Owner → Assignee
- Deadline → Milestone
- Priority → Labels
- Dependencies → Linked issues
```

### Calendar Events

```
Action → Calendar Event
- Task → Event title
- Deadline → Event date/time
- Owner → Attendees
- Context → Event description
- Dependencies → Prerequisites in notes
```

### Notion/Jira Tasks

```
Action → Notion/Jira Task
- Task → Task name
- Owner → Assignee
- Deadline → Due date
- Priority → Priority field
- Dependencies → Relations
- Context → Description
- Tags → Labels/Tags
```

## Why Actions & Outcomes Matter

### For Individuals

- **Clarity**: Know exactly what to do next
- **Context**: Understand why it matters
- **Tracking**: See progress and completion
- **Prioritization**: Focus on what's important

### For Teams

- **Coordination**: Everyone knows who's doing what
- **Dependencies**: Clear what's blocking what
- **Accountability**: Ownership is explicit
- **Visibility**: Progress is transparent

### For Organizations

- **Execution**: Strategy becomes action
- **Audit Trail**: Complete history of decisions and work
- **Learning**: Patterns emerge from outcomes
- **Optimization**: Identify bottlenecks and inefficiencies

## Next Steps

- Return to [Core Concepts](/) to explore other fundamental ideas
- Learn about [Why "Layer"?](why-layer) - Understanding TLÁO's position in your workflow
- Explore [Why "Tactical"?](why-tactical) - Understanding the time horizon

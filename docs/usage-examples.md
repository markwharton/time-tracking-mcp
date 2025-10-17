# Usage Examples

This document shows how to use the Time Tracking MCP with Claude through natural language.

## Quick Start

Just talk to Claude naturally about your time:

```
You: "Just spent 2 hours on Conduit security review"

Claude: "✓ Logged 2h for Conduit security review at 17:45
        
        Week 42 Status:
        • Total: 23.5h / 25h (94%)
        • Development: 18.0h / 20h (90%)
        • Meetings: 5.5h / 5h (110%) ⚠️"
```

## Logging Time

### Basic Logging

```
You: "2h on security review"
You: "Just finished 90 minutes on client meeting"
You: "Spent half an hour on email"
You: "1.5 hours on code review"
```

### With Tags

```
You: "2h on Conduit MCP security review #development #security"
You: "Client standup 30 minutes #meeting"
```

### Retroactive Entries

```
You: "Yesterday afternoon I did 3 hours of code review"
You: "This morning 2h on planning"
You: "2 hours ago started working on that bug fix"
You: "Last Monday I spent 4h on the integration"
```

### Multi-Company

```
You: "2h on project X for clientx"
You: "Meeting 1h for helimods"
```

## Checking Status

### Quick Status

```
You: "How am I doing this week?"
You: "Status check"
You: "Am I over my hours?"
You: "How many hours so far?"
```

**Response:**
```
📊 Week 42 Status

Total: 23.5h / 25h (94%) ✓
Remaining: 1.5h available

By Commitment:
• Development: 18.0h / 20h (90%) ✓
• Meetings: 5.5h / 5h (110%) 🚫
```

### Today's Hours

```
You: "What did I work on today?"
You: "How many hours today?"
You: "Show me today's entries"
```

**Response:**
```
📅 Thursday, 2025-10-17

Total: 6.5h

Entries:
• 17:45 Client standup (1.75h) #meeting
• 14:00 Time tracking design (1.5h) #development
• 10:00 Security review (2.5h) #development #security
• 09:15 Email and admin (0.75h) #admin
```

### Weekly Breakdown

```
You: "Show me this week's breakdown"
You: "How are my hours distributed this week?"
You: "Weekly summary"
```

**Response:**
```
📊 Week 42 Summary

Total: 23.5h / 25h (94%)

By Commitment:
• Development: 18.0h / 20h (90%)
• Meetings: 5.5h / 5h (110%) ⚠️

By Tag:
• #development: 18.0h
• #meeting: 5.5h
• #security: 4.0h
• #admin: 2.0h

By Day:
• Thursday 2025-10-17: 6.5h (4 entries)
• Wednesday 2025-10-16: 5.0h (2 entries)
• Tuesday 2025-10-15: 7.0h (3 entries)
• Monday 2025-10-14: 5.0h (2 entries)
```

## Full Reports

### This Week

```
You: "Generate this week's report"
You: "Show me the full weekly report"
You: "I need a report for this week"
```

### Last Week

```
You: "Last week's report"
You: "Generate report for last week"
```

### Specific Week

```
You: "Report for week 40"
You: "Show me week 2025-W42"
```

## Natural Language Patterns

Claude understands various ways of expressing the same thing:

### Duration Formats

- **Hours:** "2h", "2 hours", "2.5h", "two hours"
- **Minutes:** "90m", "90 minutes", "ninety minutes"
- **Mixed:** "2 hours 30 minutes", "2h30m"
- **Casual:** "half an hour", "quarter hour"

### Time References

- **Absolute:** "at 14:30", "at 2pm", "at 2:30"
- **Relative:** "2 hours ago", "this morning", "yesterday afternoon"
- **Implied:** "just finished" (means now)

### Date References

- **Specific:** "2025-10-17", "October 17"
- **Relative:** "today", "yesterday", "last Monday"
- **Implied:** If no date mentioned, defaults to today

## Tips for Best Results

### Be Specific with Project Names

✅ Good: "2h on Conduit MCP security review"  
❌ Vague: "2h on that thing"

### Use Consistent Tags

Stick to a set of tags for better tracking:
- `#development`, `#meeting`, `#admin`, `#review`, `#security`

### Check Status Regularly

Ask Claude for status throughout the week to stay on track:
```
You: "Quick status"
Claude: "You're at 23.5h / 25h (94%). You have 1.5h remaining this week."
```

### Combine Related Work

Instead of:
- "30m on email"
- "15m on email"
- "20m on email"

Do:
- "1h on email and admin" (log once at end of day)

### Use Natural Language

Don't try to match a specific format. Just tell Claude what you did:

✅ "Just wrapped up a 2 hour meeting with the client about Q4 planning"  
✅ "Been working on security review for about 90 minutes"  
✅ "Yesterday I spent the afternoon (about 3 hours) on code review"

## Multi-Company Workflows

If you work with multiple companies, specify which one:

```
You: "2h on security review for helimods"
You: "Client meeting 1h for clientx"
You: "Status for helimods"
You: "This week's report for clientx"
```

Or set a default and only specify when different:

```
# Default is helimods
You: "2h on security review"  # → logs to helimods
You: "1h meeting for clientx"  # → logs to clientx
```

## Warning System

Claude will warn you when approaching or exceeding limits:

```
You: "2h on meeting"

Claude: "✓ Logged 2h for meeting at 14:00

        Week 42 Status:
        • Total: 24.5h / 25h (98%) ⚠️ Almost at limit
        • Meetings: 5.5h / 5h (110%) 🚫 OVER LIMIT
        
        You're at 98% of your weekly limit!"
```

## Editing Entries

If you need to edit an entry:

1. **Manual edit:** Open the markdown file and edit directly
2. **Replace entry:** Log the correct time, then manually remove the old entry
3. **Delete entry:** Open the markdown file and delete the line

Files are located at: `~/Documents/time-tracking/{company}/2025-week-{N}.md`

## Example Workflow

A typical day's interaction:

```
Morning (9:15 AM):
You: "Started day with email and admin, about 45 minutes"
Claude: "✓ Logged 0.75h for email and admin..."

Midday (12:30 PM):
You: "Just finished 2.5 hours on Conduit security review"
Claude: "✓ Logged 2.5h for Conduit security review..."

Afternoon (3:00 PM):
You: "Quick status"
Claude: "You're at 8.5h / 25h (34%) this week..."

End of Day (5:45 PM):
You: "Last thing was a client meeting, 1 hour 45 minutes"
Claude: "✓ Logged 1.75h for client meeting..."

You: "What's my total today?"
Claude: "Thursday Oct 17: 5.0h (3 entries)"
```
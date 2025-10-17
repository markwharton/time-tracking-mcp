# Usage Examples

Natural language examples for using Time Tracking MCP with Claude.

## Quick Start

Just talk to Claude naturally about your time:

```
You: "Just spent 2 hours on Conduit security review"

Claude: "Logged 2h for Conduit security review at 17:45

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
You: "Documentation work 1h #development"
```

### With Projects

When you have projects configured, Claude automatically groups your time:

```
You: "2h on Time Tracking MCP"
# Automatically tagged with #development #mcp #typescript
# Grouped under "Time Tracking MCP" project

You: "1h on Conduit security review"
# Automatically tagged with #development #security
# Grouped under "Conduit MCP" project
```

### Retroactive Entries

```
You: "Yesterday afternoon I did 3 hours of code review"
You: "This morning 2h on planning"
You: "2 hours ago started working on that bug fix"
You: "Last Monday I spent 4h on the integration"
```

## Multi-Company Usage

### Single Company Mode (default)
When you only have one company configured, just log time normally:
```
You: "2h on security review"
Claude: "Logged to HeliMods..."
```

### Multi-Company Mode

#### Prefix Pattern (Recommended)
Use company name or abbreviation before the time:

```
You: "hm 2h on security review"        # HeliMods
You: "HeliMods 1h client meeting"      # HeliMods
You: "stla 3h development"             # Stellantis
You: "Stellantis 2h code review"       # Stellantis
```

#### Suffix Pattern
Specify company at the end with "for":

```
You: "2h on security review for HeliMods"
You: "1h meeting for Stellantis"
You: "Client call 90 minutes for HM"
```

#### Company-Specific Queries
```
You: "Status for HeliMods"
You: "How many hours for Stellantis this week?"
You: "Show me HeliMods report"
You: "Generate Stellantis weekly report"
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
📅 Friday, 2025-10-17

Total: 10.1h

Entries:
• 19:00 add project tracking (1.0h) #mcp
• 18:02 development (1.0h)
• 22:59 client meeting (1.5h)
• 06:46 documentation (0.3h) #development
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

Total: 10.6h / 25h (42%)

By Commitment:
• Development: 6.4h / 20h (32%)

By Project:
• Time Tracking MCP: 6.4h

By Tag:
• #development: 5.3h
• #mcp: 1.0h
• #typescript: 0.1h

By Day:
• Saturday 2025-10-18: 0.5h (1 entries)
• Friday 2025-10-17: 10.1h (12 entries)
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

### Multi-Company Reports

```
You: "Generate this week's report for HeliMods"
You: "Last week's Stellantis report"
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

Files are located at: `~/Documents/time-tracking/{company}/2025-W{N}.md`

### Flexible Duration Parsing

If you enable `FLEXIBLE_DURATION_PARSING=true` in your configuration, you can manually edit markdown files with more natural formats:

**You can use:**
- `(30m)` or `(30 minutes)`
- `(2h)` or `(2 hours)`
- `(90m)` or `(1.5h)`

**On next calculation, they normalize to:**
- `(0.5h)`
- `(2h)`
- `(1.5h)`

This makes manual editing easier while keeping files consistent.

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
Claude: "Friday Oct 17: 5.0h (3 entries)"
```

## Multi-Company Workflow Example

Working across two companies in one day:

```
Morning (9:00 AM):
You: "hm 2h on Time Tracking MCP development"
Claude: "✓ Logged to HeliMods: 2h for Time Tracking MCP..."

Afternoon (2:00 PM):
You: "stla 3h on integration testing"
Claude: "✓ Logged to Stellantis: 3h for integration testing..."

Evening (5:00 PM):
You: "Status for HeliMods"
Claude: "HeliMods Week 42: 10.6h / 25h (42%)"

You: "Status for Stellantis"
Claude: "Stellantis Week 42: 28.8h / 25h (115%) 🚫 OVER"
```

## Project Tracking

When you have projects configured, Claude automatically groups your time:

```
You: "2h on Time Tracking MCP refactoring"
# Automatically uses project tags: #development #mcp #typescript
# Shows up in project breakdown

You: "Status"
Claude: "📊 Week 42 Status

        By Project:
        • Time Tracking MCP: 6.4h
        • Conduit MCP: 12.0h"
```

This helps you see time distribution across your projects without manually tracking them.

# Time Tracking MCP

Natural language time tracking for Claude Desktop using Model Context Protocol (MCP).

## Features

- 🗣️ **Natural Language Input** - Just say "2h on security review"
- 📝 **Markdown Storage** - Human-readable files you can edit anywhere
- 🏢 **Multi-Company Support** - Track time across multiple clients/companies
- ⏰ **Flexible Time Parsing** - "2h", "90 minutes", "yesterday afternoon"
- 📊 **Auto-calculated Summaries** - Weekly totals and commitment tracking
- 🏷️ **Smart Tagging** - Auto-categorize by #development, #meeting, #admin
- ⚠️ **Commitment Warnings** - Stay within your hour limits

## Quick Start

### 1. Install

```bash
git clone <repo-url> time-tracking-mcp
cd time-tracking-mcp
npm install
npm run build
```

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "TimeTracking": {
      "command": "/path/to/node",
      "args": ["/path/to/time-tracking-mcp/dist/server.js"],
      "env": {
        "TIME_TRACKING_DIR": "/Users/you/Documents/time-tracking",
        "COMPANIES": "helimods,clientx",
        "DEFAULT_COMPANY": "helimods",
        "DISPLAY_TIMEZONE_OFFSET": "10",
        "DISPLAY_TIMEZONE_STRING": "AEST"
      }
    }
  }
}
```

### 3. Set Up Your Time Tracking Directory

```bash
mkdir -p ~/Documents/time-tracking/helimods
mkdir -p ~/Documents/time-tracking/clientx
```

Create `~/Documents/time-tracking/helimods/config.json`:

```json
{
  "company": "HeliMods",
  "commitments": {
    "development": { "limit": 20, "unit": "hours/week" },
    "meeting": { "limit": 5, "unit": "hours/week" },
    "total": { "limit": 25, "unit": "hours/week" }
  },
  "projects": {
    "Conduit MCP": {
      "tags": ["development", "security"],
      "commitment": "development"
    }
  }
}
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

## Usage

Just talk naturally to Claude:

```
You: "Just spent 2 hours on Conduit security review"
Claude: "Logged! Added 2h for Conduit security review at 17:45. 
        You're at 23.5h this week (94% of 25h limit)."

You: "How am I tracking this week?"
Claude: "Week 42 Summary:
        • Total: 23.5h / 25h (94%)
        • Development: 18.0h / 20h (90%)  
        • Meetings: 5.5h / 5h ⚠️ (110%)"

You: "Client meeting yesterday 90 minutes"
Claude: "Logged 1.5h for client meeting on Oct 16 at 15:00 ✓"
```

## Natural Language Examples

**Quick logging:**
- "2h on security review"
- "Just finished 90 minutes on client meeting"
- "Spent half an hour on email"

**Retroactive entries:**
- "Yesterday afternoon I did 3 hours of code review"
- "This morning 2h on planning"
- "2 hours ago started working on that bug fix"

**Checking status:**
- "How many hours this week?"
- "Am I over my limit?"
- "What did I work on today?"
- "Show me this week's report"

**Multi-company:**
- "2h on project X for clientx"
- "Meeting 1h for helimods"

## File Structure

```
~/Documents/time-tracking/
  helimods/
    config.json
    2025-week-42.md
    2025-week-43.md
  clientx/
    config.json
    2025-week-42.md
```

Each markdown file is human-readable and editable:

```markdown
# Time Tracking - HeliMods - Week 42 (Oct 14-20, 2025)

## Summary
- **Total:** 23.5h / 25h limit (94%)
- **Development:** 18.0h / 20h (90%)
- **Meetings:** 5.5h / 5h ⚠️ OVER by 0.5h

---

## 2025-10-17 Thursday (6.5h)

- 17:45 Client standup (1.75h) #meeting
- 14:00 Time tracking design (1.5h) #development #meta
- 10:00 Security review (2.5h) #development #security
- 09:15 Email and admin (0.75h) #admin
```

## Tools Available

Claude automatically uses these tools when you interact naturally:

- `log_time` - Log a completed task
- `check_hours` - Check time totals
- `weekly_report` - Generate formatted report
- `status` - Quick status check

You never call these directly - just talk to Claude naturally!

## Configuration

### Environment Variables

- `TIME_TRACKING_DIR` - Where to store markdown files (default: `~/Documents/time-tracking`)
- `COMPANIES` - Comma-separated list of companies (default: `default`)
- `DEFAULT_COMPANY` - Default company when not specified (default: first company)
- `DISPLAY_TIMEZONE_OFFSET` - Hours offset from UTC (default: `0`)
- `DISPLAY_TIMEZONE_STRING` - Timezone display name (default: `UTC`)
- `FLEXIBLE_DURATION_PARSING` - Enable flexible duration parsing in markdown files (default: `false`)

#### Flexible Duration Parsing (Experimental)

When `FLEXIBLE_DURATION_PARSING=true`, the markdown parser accepts multiple duration formats:

**Supported formats:**
- Standard: `(2h)`, `(2.5h)`
- Minutes: `(30m)`, `(90 minutes)`
- Natural: `(2 hours)`, `(half an hour)`

**How it works:**
1. Manual edits can use any format: `- 06:01 debugging (30m) #development`
2. On next recalculation, entries normalize to standard format: `- 06:01 debugging (0.5h) #development`
3. Invalid durations are silently ignored (treated as comments)

**To enable:**
```json
{
  "mcpServers": {
    "TimeTracking": {
      "command": "/path/to/node",
      "args": ["/path/to/time-tracking-mcp/dist/server.js"],
      "env": {
        "FLEXIBLE_DURATION_PARSING": "true"
      }
    }
  }
}
```

**Safety:** When disabled (default), only strict format `(Xh)` is parsed, providing protection against accidental format corruption.

### Company Config (config.json)

Each company directory should have a `config.json`:

```json
{
  "company": "Company Name",
  "commitments": {
    "development": { "limit": 20, "unit": "hours/week" },
    "meeting": { "limit": 5, "unit": "hours/week" },
    "total": { "limit": 25, "unit": "hours/week" }
  },
  "projects": {
    "Project Name": {
      "tags": ["development", "security"],
      "commitment": "development"
    }
  },
  "tagMappings": {
    "dev": "development",
    "sync": "meeting"
  }
}
```

## Development

```bash
# Build
npm run build

# Development mode (auto-reload)
npm run dev

# Clean build
npm run rebuild

# Release (semantic versioning)
npm run release        # Auto-increment patch
npm run release:minor  # Increment minor version
npm run release:major  # Increment major version
```

## Versioning

This project uses [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for semantic versioning.

**Commit message format:**
```
feat: add support for monthly reports
fix: correct duration parsing for fractional hours
perf: optimize summary calculations
```

## Architecture

- **MCP Server** - Provides tools to Claude
- **Natural Language** - Claude parses your intent
- **Markdown Storage** - Simple, portable, human-editable
- **Auto-summaries** - Calculated on-the-fly from entries

## Why MCP?

Traditional time tracking tools require context switching and structured input. With MCP:

1. Stay in Claude - no app switching
2. Natural language - no forms or timers
3. Voice-friendly - Mac dictation works perfectly
4. Portable data - plain markdown files
5. AI-enhanced - Claude understands your intent

## License

MIT

## Author

Mark Wharton
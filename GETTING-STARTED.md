# Getting Started with Time Tracking MCP

This guide will help you set up and start using the Time Tracking MCP in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Claude Desktop installed
- Basic command line familiarity

## Quick Setup (5 minutes)

### 1. Clone and Build

```bash
git clone <repo-url> time-tracking-mcp
cd time-tracking-mcp
npm install
npm run build
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Create your time tracking directory
- Set up company folders
- Create initial config files
- Show you the Claude config to add

### 3. Configure Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

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

**Replace:**
- `/path/to/node` with output of `which node`
- `/path/to/time-tracking-mcp` with your actual path
- Adjust timezone for your location

### 4. Restart Claude Desktop

Close and reopen Claude Desktop completely.

## Manual Setup (if you prefer)

### 1. Create Directory Structure

```bash
mkdir -p ~/Documents/time-tracking/helimods
mkdir -p ~/Documents/time-tracking/clientx
```

### 2. Create Config Files

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
  },
  "tagMappings": {
    "dev": "development",
    "sync": "meeting"
  }
}
```

See `docs/example-config.json` for a complete example.

### 3. Build and Configure

```bash
npm install
npm run build
```

Then add to Claude config as shown above.

## First Time Use

### 1. Verify Installation

Open Claude and type:

```
You: "Can you help me track time?"
```

If Claude mentions the time tracking tools, you're good to go!

### 2. Log Your First Entry

```
You: "Just spent 2 hours on project setup"

Claude: "✓ Logged 2h for project setup at 14:30
        
        Week 42 Status:
        • Total: 2.0h / 25h (8%)"
```

### 3. Check Status

```
You: "How am I doing this week?"

Claude: "📊 Week 42 Status
        
        Total: 2.0h / 25h (8%) ✓
        Remaining: 23.0h available"
```

## Understanding the Files

### Directory Structure

```
~/Documents/time-tracking/
  helimods/
    config.json          # Company configuration
    2025-week-42.md      # Week 42 time entries
    2025-week-43.md      # Week 43 time entries
  clientx/
    config.json
    2025-week-42.md
```

### Week File Format

`2025-week-42.md` looks like this:

```markdown
# Time Tracking - HeliMods - Week 42 (Oct 14-20, 2025)

## Summary
- **Total:** 23.5h / 25h limit (94%)
- **Development:** 18.0h / 20h (90%)
- **Meetings:** 5.5h / 5h (110%) ⚠️
- **Remaining:** 1.5h available

---

## 2025-10-17 Thursday (6.5h)

- 17:45 Client standup (1.75h) #meeting
- 14:00 Time tracking design (1.5h) #development
- 10:00 Security review (2.5h) #development #security
- 09:15 Email and admin (0.75h) #admin
```

**You can edit these files directly!** They're just markdown.

## Common Tasks

### Adding Time

```
"2h on security review"
"Just finished 90 minutes on client meeting"
"Spent half an hour on email"
```

### Checking Hours

```
"How many hours today?"
"Status check"
"What did I work on this week?"
```

### Getting Reports

```
"Show me this week's report"
"Last week's report"
"Generate a report"
```

### Multi-Company

```
"2h on project X for clientx"
"Status for helimods"
```

## Customizing Your Setup

### Adjust Commitments

Edit `config.json` in your company folder:

```json
{
  "commitments": {
    "development": { "limit": 30, "unit": "hours/week" },
    "meeting": { "limit": 10, "unit": "hours/week" },
    "total": { "limit": 40, "unit": "hours/week" }
  }
}
```

### Add Projects

```json
{
  "projects": {
    "Conduit MCP": {
      "tags": ["development", "database", "security"],
      "commitment": "development"
    },
    "Client Project": {
      "tags": ["consulting", "implementation"],
      "commitment": "development"
    }
  }
}
```

### Tag Mappings

Make shortcuts for common tags:

```json
{
  "tagMappings": {
    "dev": "development",
    "meet": "meeting",
    "sync": "meeting",
    "call": "meeting"
  }
}
```

## Troubleshooting

### Claude doesn't respond to time tracking

1. Check Claude Desktop config is correct
2. Restart Claude Desktop completely
3. Check logs: `~/Library/Logs/Claude/mcp*.log`

### "No module found" errors

```bash
cd time-tracking-mcp
npm run rebuild
```

### Wrong timezone

Update `DISPLAY_TIMEZONE_OFFSET` in Claude config:
- Sydney/Melbourne: `10` (AEST) or `11` (AEDT)
- London: `0` (GMT) or `1` (BST)
- New York: `-5` (EST) or `-4` (EDT)
- Los Angeles: `-8` (PST) or `-7` (PDT)

### Files not being created

Check `TIME_TRACKING_DIR` path in config:
- Use full absolute path (not ~)
- Ensure directory exists and is writable

## Tips for Success

### 1. Log Regularly

Don't wait until end of day - log as you go:

```
Morning: "Started with email, 30 minutes"
After task: "Just finished 2h on security review"
End of day: "Client meeting, 1 hour"
```

### 2. Be Consistent with Names

Use similar task descriptions:
- ✅ "Conduit MCP: Security review"
- ✅ "Conduit MCP: Health check implementation"
- ❌ "Working on that Conduit thing"

### 3. Check Status Often

```
"Quick status"
```

Stay aware of your hours throughout the week.

### 4. Use Tags

Tags help with reporting and commitment tracking:

```
"2h on security review #development #security"
```

### 5. Review Weekly

At end of week:

```
"Generate this week's report"
```

Review what you worked on and adjust next week.

## Next Steps

- Read [usage-examples.md](docs/usage-examples.md) for more examples
- Customize your `config.json` files
- Set up a second company if needed
- Start tracking!

## Getting Help

- Check the [README.md](README.md) for full documentation
- Look at [example-config.json](docs/example-config.json)
- Read [usage-examples.md](docs/usage-examples.md)

## Quick Reference

**Log time:**
```
"2h on [task]"
"Just finished [duration] on [task]"
```

**Check status:**
```
"Status"
"How many hours this week?"
```

**Get report:**
```
"Show me this week's report"
```

**Multi-company:**
```
"[time] on [task] for [company]"
```

That's it! Start tracking your time naturally with Claude. 🚀
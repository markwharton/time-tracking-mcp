# Claude Code CLI vs Claude Desktop: MCP Server Configuration

## Overview

There are **two separate environments** for running Claude with MCP servers, each with its own configuration:

1. **Claude Desktop** - The desktop application
2. **Claude Code CLI** - The command-line interface

These are **independent** and require **separate configurations** for MCP servers.

## Key Differences

### Claude Desktop

**Config Location:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Configuration Format:**
```json
{
  "mcpServers": {
    "TimeTracking": {
      "command": "/path/to/node",
      "args": ["/path/to/server.js"],
      "env": {
        "TIME_TRACKING_DIR": "/Users/markwharton/Documents/time-tracking",
        "COMPANIES": "HeliMods,Stellantis",
        "DEFAULT_COMPANY": "HeliMods",
        "DISPLAY_TIMEZONE_OFFSET": "10",
        "DISPLAY_TIMEZONE_STRING": "AEST"
      }
    }
  }
}
```

**How to Update:**
- Manually edit the `claude_desktop_config.json` file
- **Restart Claude Desktop app** for changes to take effect

**When to Use:**
- Running Claude in the desktop application
- Using the Claude web interface through the desktop app

---

### Claude Code CLI

**Config Location:**
```
~/.claude.json
```

**Configuration Format:**
The configuration is embedded in a larger JSON structure. Look for the `mcpServers` section:
```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "TimeTracking": {
          "type": "stdio",
          "command": "/path/to/node",
          "args": ["/path/to/server.js"],
          "env": {
            "TIME_TRACKING_DIR": "/Users/markwharton/Documents/time-tracking",
            "COMPANIES": "HeliMods,Stellantis",
            "DEFAULT_COMPANY": "HeliMods",
            "DISPLAY_TIMEZONE_OFFSET": "10",
            "DISPLAY_TIMEZONE_STRING": "AEST"
          }
        }
      }
    }
  }
}
```

**How to Update:**
- **Add server:** `claude mcp add --transport stdio <name> <command> <args...>`
  - ⚠️ **This command does NOT support environment variables**
- **Add environment variables:** Manually edit `~/.claude.json`
- **Restart Claude Code CLI** (Ctrl-C and restart) for changes to take effect

**When to Use:**
- Running Claude from the command line with the `claude` command
- Working in terminal-based workflows

---

## Common Confusion Points

### "It's all managed by Claude Desktop"
**FALSE** - This is misleading. While Claude Desktop has its own MCP configuration, Claude Code CLI has a completely separate configuration file and does not automatically inherit settings from Claude Desktop.

### "Just restart Claude Desktop"
**Incomplete** - If you're using Claude Code CLI, restarting Claude Desktop does nothing. You need to restart the CLI (Ctrl-C and rerun `claude`).

### "Use `claude mcp add` to configure the server"
**Incomplete** - The `claude mcp add` command only sets the basic connection details (command and args). It does **not** support adding environment variables. You must manually edit `~/.claude.json` to add the `env` section.

---

## The Problem We Encountered

### What Happened:
1. Configured MCP server for Claude Desktop with proper environment variables
2. Used `claude mcp add` to add the server to Claude Code CLI
3. The CLI configuration was created **without environment variables** (`"env": {}`)
4. Time tracking entries went to "default" company instead of "HeliMods"

### Why It Happened:
- `claude mcp add` doesn't support the `--env` flag or similar option
- The CLI was using its own config (`~/.claude.json`) with empty env
- Claude Desktop's config was correct but irrelevant for CLI usage

### The Fix:
1. Manually edit `~/.claude.json`
2. Find the TimeTracking server configuration
3. Replace `"env": {}` with the full environment variable object
4. Restart Claude Code CLI

---

## Best Practices

### When Developing MCP Servers:

1. **Always configure both environments** if you plan to use both
2. **Keep environment variables in sync** between the two configs
3. **Test in the actual environment** you'll be using (CLI vs Desktop)
4. **Document which environment is being used** in your README

### Configuration Workflow:

**For Claude Desktop:**
```bash
# Edit the config file
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restart Claude Desktop app
# (Quit and reopen from Applications)
```

**For Claude Code CLI:**
```bash
# Add the server (basic setup only)
claude mcp add --transport stdio TimeTracking /path/to/node /path/to/server.js

# Add environment variables (manual edit required)
code ~/.claude.json
# Find the server config and add the "env" section

# Restart Claude Code CLI
# Press Ctrl-C, then run:
claude
```

---

## Verification

### Check Claude Desktop Config:
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | grep -A 15 TimeTracking
```

### Check Claude Code CLI Config:
```bash
cat ~/.claude.json | grep -A 20 '"TimeTracking"'
```

### Check Active MCP Servers in CLI:
```bash
claude mcp list
```

---

## Time Lost on This Issue

**Estimated time debugging:** 1.5 hours

**Root causes:**
- Incomplete documentation about dual configuration requirement
- `claude mcp add` command doesn't warn about missing env variables
- Error messages don't indicate which config is being used
- Assumption that Claude Desktop config would be inherited by CLI

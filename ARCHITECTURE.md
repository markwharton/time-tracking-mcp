# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│                   (Natural Language)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ "Just spent 2h on security review"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE DESKTOP                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Natural Language Understanding                            │ │
│  │  • Parse intent from user message                          │ │
│  │  • Extract: task, duration, time, tags                     │ │
│  │  • Map to appropriate tool                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MCP Protocol (JSON-RPC)
                             │ log_time({task, duration, ...})
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TIME TRACKING MCP SERVER                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TOOL LAYER (src/tools/)                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │log_time  │ │ status   │ │check_hrs │ │ weekly   │   │   │
│  │  │          │ │          │ │          │ │ report   │   │   │
│  │  └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │   │
│  │        │           │            │            │          │   │
│  │        └───────────┴────────────┴────────────┘          │   │
│  └────────────────────────────┬──────────────────────────────┘   │
│                               │                                  │
│  ┌────────────────────────────▼──────────────────────────────┐   │
│  │  SERVICE LAYER (src/services/)                            │   │
│  │  ┌──────────────────┐  ┌────────────────┐                │   │
│  │  │ MarkdownManager  │  │ DurationParser │                │   │
│  │  │ • addEntry       │  │ • parseDuration│                │   │
│  │  │ • getWeeklySummary│  │ • formatDuration│               │   │
│  │  │ • loadConfig     │  │                │                │   │
│  │  └─────────┬────────┘  └────────┬───────┘                │   │
│  │            │                    │                         │   │
│  │            └────────────────────┘                         │   │
│  └────────────────────────────┬──────────────────────────────┘   │
│                               │                                  │
│  ┌────────────────────────────▼──────────────────────────────┐   │
│  │  UTILITY LAYER (src/utils/)                               │   │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────┐              │   │
│  │  │date-utils │ │file-utils │ │tool-response│              │   │
│  │  │• parseDate│ │• readFile │ │• createText│              │   │
│  │  │• parseTime│ │• writeFile│ │• withError │              │   │
│  │  └───────────┘ └───────────┘ └────────────┘              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FILE SYSTEM STORAGE                            │
│                                                                   │
│  ~/Documents/time-tracking/                                      │
│    ├── helimods/                                                 │
│    │   ├── config.json         ◄─── Company config              │
│    │   ├── 2025-week-42.md     ◄─── Time entries                │
│    │   └── 2025-week-43.md                                       │
│    └── clientx/                                                  │
│        ├── config.json                                           │
│        └── 2025-week-42.md                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Logging Time

```
User: "2h on security review"
  │
  ▼
Claude: Parse → {task: "security review", duration: "2h"}
  │
  ▼
MCP Tool: log_time({task, duration, tags: ["development"]})
  │
  ▼
MarkdownManager: 
  • Parse duration → 2.0 hours
  • Get current time → 14:30
  • Format entry → "- 14:30 security review (2.0h) #development"
  • Find week file → 2025-week-42.md
  • Append entry
  • Recalculate summary
  │
  ▼
File System: Write 2025-week-42.md
  │
  ▼
MarkdownManager: Load weekly summary
  │
  ▼
MCP Tool: Format response
  │
  ▼
Claude: "✓ Logged 2h... You're at 23.5h / 25h (94%)"
  │
  ▼
User: Sees confirmation
```

### 2. Checking Status

```
User: "Status check"
  │
  ▼
Claude: Map to status tool
  │
  ▼
MCP Tool: status()
  │
  ▼
MarkdownManager:
  • Get current week → week 42
  • Read 2025-week-42.md
  • Parse all entries
  • Calculate totals
  • Group by commitment
  │
  ▼
MCP Tool: Format summary
  │
  ▼
Claude: "📊 Week 42 Status: 23.5h / 25h..."
  │
  ▼
User: Sees status
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         LAYERS                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Interface Layer (Tools)                                    │
│  • Validates input                                          │
│  • Calls services                                           │
│  • Formats output                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Business Logic (Services)                                  │
│  • Parses data formats                                      │
│  • Reads/writes files                                       │
│  • Calculates summaries                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Utilities (Utils)                                          │
│  • Date/time handling                                       │
│  • File I/O                                                 │
│  • Error handling                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Storage (Markdown Files)                                   │
│  • Human-readable                                           │
│  • Version controllable                                     │
│  • Portable                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Module Dependencies

```
server.ts
  │
  ├──► tools/log-time.ts
  │     │
  │     ├──► services/markdown-manager.ts
  │     │     │
  │     │     ├──► utils/file-utils.ts
  │     │     ├──► utils/date-utils.ts
  │     │     └──► services/duration-parser.ts
  │     │
  │     ├──► services/duration-parser.ts
  │     ├──► utils/date-utils.ts
  │     └──► utils/tool-response.ts
  │
  ├──► tools/status.ts
  │     │
  │     ├──► services/markdown-manager.ts
  │     └──► utils/tool-response.ts
  │
  ├──► tools/check-hours.ts
  │     │
  │     ├──► services/markdown-manager.ts
  │     └──► utils/tool-response.ts
  │
  └──► tools/weekly-report.ts
        │
        ├──► services/markdown-manager.ts
        └──► utils/tool-response.ts
```

## Execution Flow

### Initialization (Startup)

```
1. Load package.json (version info)
2. Import all tools
   └─► Each tool calls registerTool()
       └─► Adds to toolRegistry
3. Create MCP Server instance
4. Set up request handlers
   ├─► ListTools: Return all registered tools
   └─► CallTool: Execute tool by name
5. Connect stdio transport
6. Wait for requests
```

### Request Handling (Runtime)

```
1. Claude sends CallTool request
   ├─► tool name
   └─► arguments

2. Server receives request
   └─► Look up tool in registry

3. Execute tool handler
   ├─► Validate arguments
   ├─► Call service layer
   ├─► Process data
   └─► Return response

4. Server sends response
   └─► Formatted text content

5. Claude presents to user
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│  MCP SERVER (Stateless)                                     │
│  • No memory between calls                                  │
│  • Each request independent                                 │
│  • Tools registered at startup                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Reads/Writes
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE SYSTEM (State Storage)                                │
│  • Markdown files = source of truth                         │
│  • Config files = settings                                  │
│  • No database needed                                       │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Input
  │
  ▼
Tool Handler (withErrorHandler wrapper)
  │
  ├──► Try
  │     │
  │     ├──► Service Layer
  │     │     │
  │     │     ├──► Try
  │     │     │     │
  │     │     │     ├──► File Operations
  │     │     │     │
  │     │     │     └──► Throw specific error
  │     │     │
  │     │     └──► Catch & re-throw
  │     │
  │     └──► Return success response
  │
  └──► Catch
        │
        └──► createErrorResponse(error)
              │
              └──► Return error message to user
```

## Configuration Flow

```
Environment Variables (Claude config)
  │
  ├─► TIME_TRACKING_DIR ────────┐
  ├─► COMPANIES ─────────────────┤
  ├─► DEFAULT_COMPANY ───────────┤
  ├─► DISPLAY_TIMEZONE_OFFSET ───┤
  └─► DISPLAY_TIMEZONE_STRING ───┤
                                 │
                                 ▼
                    config/environment.ts
                                 │
                                 ▼
                         Services & Tools
                                 │
                                 ▼
                    ~/Documents/time-tracking/
                      {company}/config.json
                                 │
                                 ▼
                      Business Logic (commitments, projects)
```

## Performance Characteristics

```
Operation              Complexity    Typical Time
─────────────────────────────────────────────────
Read week file         O(1)          < 1ms
Parse entries          O(n)          < 1ms (n=50)
Calculate summary      O(n)          < 1ms (n=50)
Write file             O(1)          < 5ms
Total log_time         O(n)          < 10ms

Where n = number of entries per week (typically < 100)
```

## Scalability Limits

```
File Size:
  Typical week: 5 KB (50 entries)
  Max practical: 100 KB (1000 entries)
  Performance: Linear, always fast

Companies:
  Limited by: File system / user organization
  Practical: < 10 companies
  Each isolated: No cross-talk

History:
  Years of data: < 5 MB
  Read time: Only current week loaded
  No degradation: Past data unused
```

## Security Boundaries

```
┌─────────────────────────────────────────────────┐
│  Claude Desktop (Trusted)                       │
│  • User's local app                             │
│  • Full access to MCP server                    │
└────────────────┬────────────────────────────────┘
                 │ MCP Protocol (local)
┌────────────────▼────────────────────────────────┐
│  MCP Server (Trusted)                           │
│  • Runs as user                                 │
│  • File system permissions                      │
│  • No network access                            │
└────────────────┬────────────────────────────────┘
                 │ File I/O
┌────────────────▼────────────────────────────────┐
│  File System (User's data)                      │
│  • ~/Documents/time-tracking/                   │
│  • User ownership                               │
│  • OS-level permissions                         │
└─────────────────────────────────────────────────┘

No external services, no authentication needed
```

---

This architecture prioritizes:
- ✅ **Simplicity** - Easy to understand
- ✅ **Reliability** - Minimal failure points
- ✅ **Performance** - Fast operations
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **User Control** - Local data, editable files
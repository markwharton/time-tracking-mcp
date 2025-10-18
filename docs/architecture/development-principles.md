# Development Principles for Claude Code

This document provides guidance for Claude Code when working on this codebase.

## Core Principles

1. **Accuracy over speed** - Correct implementations are more important than fast implementations
2. **Transparency** - Always disclose implementation decisions and tradeoffs
3. **Ask, don't assume** - When in doubt, ask the user
4. **No surprises** - The user should never discover shortcuts after the fact
5. **Complete work** - Finish what you start; don't leave TODOs without permission
6. **Investigate before fixing** - When debugging, always investigate to find the root cause before proposing changes. Use methodical analysis (reading code, testing hypotheses, examining actual data) to understand what's actually broken. Prefer minimal, surgical fixes that address the real problem over broad refactors or reversions. Jumping to "undo the last change" without understanding why something broke often misses the actual issue.
7. **Clean breaks over backward compatibility** - During active development, prefer clean implementations over maintaining backward compatibility unless explicitly requested. This results in simpler code, less technical debt, and easier maintenance.
8. **Test assumptions** - When you think you've found the problem, verify it with a minimal test case before proposing a fix. Don't assume correlation equals causation.

## DRY Principle (Don't Repeat Yourself)

**Single Source of Truth**: Every piece of knowledge should have one authoritative representation in the system.

### Core Philosophy

When you find yourself copying code between files, stop and create a shared utility instead. If logic appears in multiple places, it should be extracted to a single location and imported where needed.

### Application in Time Tracking MCP

#### Example 1: Report Formatting

```typescript
// ✅ GOOD: Create shared formatting utilities
// src/utils/report-formatters.ts
export function formatProjectBreakdown(byProject: Record<string, number>): string {
    if (Object.keys(byProject).length === 0) return '';

    let output = `**By Project:**\n`;
    const sorted = Object.entries(byProject).sort((a, b) => b[1] - a[1]);

    for (const [project, hours] of sorted) {
        output += `• ${project}: ${hours.toFixed(1)}h\n`;
    }
    return output + '\n';
}

// Import and use in multiple tools
import { formatProjectBreakdown } from '../utils/report-formatters.js';
response += formatProjectBreakdown(summary.byProject);
```

```typescript
// ❌ BAD: Copy-paste the same formatting logic
// check-hours.ts
if (Object.keys(summary.byProject).length > 0) {
    response += `**By Project:**\n`;
    const sortedProjects = Object.entries(summary.byProject)
        .sort((a, b) => b[1] - a[1]);
    for (const [project, hours] of sortedProjects) {
        response += `• ${project}: ${hours.toFixed(1)}h\n`;
    }
}

// weekly-report.ts - DUPLICATE CODE!
if (Object.keys(summary.byProject).length > 0) {
    response += `**By Project:**\n`;
    const sortedProjects = Object.entries(summary.byProject)
        .sort((a, b) => b[1] - a[1]);
    for (const [project, hours] of sortedProjects) {
        response += `• ${project}: ${hours.toFixed(1)}h\n`;
    }
}
```

#### Example 2: Derive from Configuration

```typescript
// ✅ GOOD: Derive list from single source
const companies = TimeTrackingEnvironment.getCompanies();
const companyCount = companies.length;
const isMultiCompany = companyCount > 1;

// ❌ BAD: Hardcode assumptions
const isMultiCompany = true; // Don't hardcode - derive from config
```

### Benefits

1. **Automatic updates**: Change formatting once, applies everywhere
2. **No sync issues**: Can't forget to update duplicates
3. **Less maintenance**: One place to fix bugs
4. **Easier testing**: Test formatting logic once, not N times

### Common Patterns

#### Share formatting utilities
- Report section formatters (projects, tags, commitments)
- Duration formatters (already done well with `formatDuration`)
- Status indicators and emojis

#### Derive data from source of truth
- Company lists from environment
- Valid commitment names from config schema
- Available tags from project definitions

#### Extract repeated logic
- Sorting and filtering operations
- Validation rules
- Calculation methods

### When Duplication Is Acceptable

Sometimes duplication is okay:
- **Different contexts**: Test fixtures vs production data
- **Performance**: Pre-computed values for hot paths
- **Coupling concerns**: Tools shouldn't share mutable state

The key question: *"If this logic changes, should both places change?"*
- **Yes** → Don't duplicate, extract to shared utility
- **No** → Duplication may be appropriate

### Refactoring Checklist

When you add or modify code:
1. ✅ Is this logic already elsewhere? → Extract to utility
2. ✅ Will this logic be needed elsewhere? → Make it reusable from the start
3. ✅ Can this be derived from existing data? → Don't store separately
4. ✅ Is there a simpler abstraction? → Consider before implementing

## Code Organization

- **src/utils/** - Shared utilities and helpers
- **src/services/** - Business logic and core operations
- **src/tools/** - MCP tool implementations (should be thin, delegate to services/utils)
- **src/types/** - TypeScript type definitions

Keep tools thin - they should orchestrate, not implement. Heavy logic belongs in services or utils.

## Automatic Normalization

### Design Philosophy

Time tracking markdown files self-heal on every write operation. This ensures consistent, readable formatting without requiring manual maintenance or additional user commands.

### Spacing Normalization

The `normalizeSpacing()` method runs automatically when logging time entries:

**What it does:**
- Enforces 8 spacing rules for consistent layout (see [Format Specification](../reference/format-specification.md))
- Removes excessive blank lines between entries
- Protects user content with blank line buffers
- Processes entire file, fixing both new and existing issues

**Implementation approach:**
- State machine tracking line types (title, header, entry, separator, user content)
- Look-ahead/look-behind for context-aware decisions
- Preserve all content, only adjust spacing
- Run after all content modifications (entry insertion, summary updates, duration normalization)

**Why automatic:**
- Users can manually edit files without breaking formatting
- Handles edge cases from copy-paste or external edits
- No need for separate "format" or "cleanup" commands
- Files stay readable in git diffs

### Duration Normalization

When `FLEXIBLE_DURATION_PARSING=true`, the system also normalizes entry durations:

**What it does:**
- Accepts flexible formats: `(30m)`, `(2 hours)`, `(90 minutes)`
- Automatically converts to standard: `(0.5h)`, `(2h)`, `(1.5h)`
- Runs before spacing normalization

**Design:**
- Single source of truth: `formatDuration()` in duration-parser.ts
- Consistent across all tools and file operations
- Preserves manual edits while enforcing standard format

### Auto-Healing Philosophy

**Key principle:** Trust the recalculation, don't store derived data.

The markdown files are designed to auto-heal:
1. **Summaries** - Always recalculated, never stored
2. **Day totals** - Derived from entries, updated on every write
3. **Spacing** - Normalized automatically, no user intervention
4. **Durations** - Converted to standard format transparently

**Benefits:**
- Manual edits can't corrupt summaries (they're recalculated)
- Files remain in consistent state
- No "sync" or "rebuild" commands needed
- Git-friendly: fewer spurious changes

## Markdown Formatting

### Multi-line Bold/Italic Lists

When creating lists with bold or italic text that should appear on separate lines, add **two spaces** at the end of each line to force a line break in Markdown.

**Example (note the two spaces at end of lines 1 and 2):**
```markdown
**Last Updated:** 2025-10-15  
**Document Purpose:** Define standards  
**Owner:** Development Team
```

**Without double spaces**, these lines will run together in rendered Markdown. The spaces are invisible but critical for proper rendering.

**When to use:**
- Document headers with multiple metadata fields
- Lists of properties or attributes that should stack vertically
- Status indicators that should appear on separate lines

## See Also

- [Development Guide](../guides/development.md) - Project structure and workflow
- [Format Specification](../reference/format-specification.md) - Technical format details
- [Tag System Guide](tag-system.md) - Core architecture

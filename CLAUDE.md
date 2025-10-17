# Development Principles for Claude Code

This document provides guidance for Claude Code when working on this codebase.

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

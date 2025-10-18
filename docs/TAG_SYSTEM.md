# Tag System Design

## Overview

The time tracking system uses a flexible tag-based architecture that connects your daily work entries to time commitments through an elegant indirection layer.

## Architecture

```
Time Entry → Tags → Tag Mappings → Projects → Commitments
                                 ↘
                                   Reports & Breakdowns
```

### Components

1. **Tags**: Freeform labels attached to time entries
2. **Tag Mappings**: Shortcuts and aliases (e.g., `#dev` → `#development`)
3. **Projects**: Named groups that match specific tags and link to commitments
4. **Commitments**: Time budget categories with limits (e.g., 20h/week for development)

## How It Works

### 1. Time Entry Creation

```
- 10:00 Fixed authentication bug (1.5h) #dev #mcp #bug
```

**What happens:**
- Raw tags: `[dev, mcp, bug]`
- After mapping: `[development, mcp, bug]` (dev → development)

### 2. Tag Mapping (Aliases)

Tag mappings provide shortcuts for commonly used commitment names:

```json
{
  "tagMappings": {
    "dev": "development",
    "sync": "meeting",
    "ts": "typescript",
    "test": "testing"
  }
}
```

**Purpose**: Type less while maintaining semantic clarity in reports

### 3. Project Matching

Projects are the bridge between tags and commitments:

```json
{
  "projects": {
    "Time Tracking MCP": {
      "tags": ["mcp"],
      "commitment": "development"
    },
    "Client Work": {
      "tags": ["client", "consulting"],
      "commitment": "development"
    },
    "HeliMods Meetings": {
      "tags": ["meeting", "sync"],
      "commitment": "meeting"
    }
  }
}
```

**Matching logic**: ANY tag in the entry that appears in a project's tag list = match

**Critical: Use unique identifier tags for projects**

Each project should have at least one unique tag that unambiguously identifies it:
- ✅ `#mcp` uniquely identifies "Time Tracking MCP"
- ✅ `#client` uniquely identifies "Client Work"
- ❌ `#development` is shared across multiple projects - not a good project identifier

**Example:**
- Entry: `#dev #mcp` → Matches "Time Tracking MCP" (has `#mcp`)
- Entry: `#client #bug` → Matches "Client Work" (has `#client`)
- Entry: `#dev #docs` → No project match (but still tracks to development commitment)

**Best practice**: Define one primary tag per project:
```json
{
  "projects": {
    "Time Tracking MCP": {
      "tags": ["mcp"],  // Primary identifier
      "commitment": "development"
    },
    "Client Work": {
      "tags": ["client", "consulting"],  // Either tag matches
      "commitment": "development"
    }
  }
}
```

### 4. Commitment Tracking

Commitments define your time budgets:

```json
{
  "commitments": {
    "development": {
      "limit": 20,
      "unit": "hours/week"
    },
    "meeting": {
      "limit": 5,
      "unit": "hours/week"
    },
    "total": {
      "limit": 25,
      "max": 30,
      "unit": "hours/week"
    }
  }
}
```

**How tags map to commitments:**

1. **Direct match**: Tag name matches commitment name
   - `#development` → `development` commitment ✓
   - `#meeting` → `meeting` commitment ✓

2. **Via tag mapping**: Shortcut maps to commitment name
   - `#dev` → `development` (via mapping) → `development` commitment ✓
   - `#sync` → `meeting` (via mapping) → `meeting` commitment ✓

3. **Via project**: Tag matches project, project defines commitment
   - `#mcp` → "Time Tracking MCP" project → `development` commitment ✓
   - `#client` → "Client Work" project → `development` commitment ✓

## Tag Strategy Best Practices

### Three-Layer Tagging System

**Layer 1: Commitment Tags (What budget does this count against?)**
- `#dev` / `#development` - Development work (maps to development commitment)
- `#sync` / `#meeting` - Meetings and syncs (maps to meeting commitment)

**Layer 2: Project Tags (What are you working on?)**
- `#mcp` - Time Tracking MCP project
- `#client` - Client work
- `#helimods` - HeliMods internal work

**IMPORTANT**: Choose unique, short identifiers for projects that don't overlap with commitment or activity tags.

**Layer 3: Activity Tags (What kind of work?)**
- `#bug` - Bug fixes
- `#test` - Writing tests
- `#docs` - Documentation
- `#refactor` - Refactoring
- `#learn` - Learning/research

### Choosing Project Identifier Tags

**Good project tags:**
- ✅ Unique to the project: `#mcp`, `#stellantis`, `#helimods`
- ✅ Short and memorable: `#client`, `#internal`
- ✅ Unambiguous: `#timetracking` (not `#tracking`)

**Avoid:**
- ❌ Generic activity tags: `#development`, `#coding` (these are commitment tags)
- ❌ Overlapping tags: Don't use `#meeting` as both project and commitment tag
- ❌ Ambiguous abbreviations: `#tt` could mean many things

### Example Entries

```markdown
## 2025-10-18 Saturday

- 10:00 Fixed parser bug in markdown manager (2h) #dev #mcp #bug
- 14:00 Client standup meeting (30m) #sync #client
- 15:00 Writing unit tests for duration parser (1.5h) #dev #mcp #test
- 17:00 Code review for authentication PR (1h) #dev #client
- 18:00 Reading TypeScript docs (45m) #learn
```

**Results in:**
- **Commitment tracking**:
  - Development: 4.5h (from #dev entries)
  - Meeting: 0.5h (from #sync entry)

- **Project breakdown**:
  - Time Tracking MCP: 3.5h (entries with #mcp)
  - Client Work: 1.5h (entries with #client)

- **Tag breakdown**:
  - #development: 4.5h
  - #mcp: 3.5h
  - #client: 1.5h
  - #bug: 2h
  - #test: 1.5h
  - #meeting: 0.5h
  - #learn: 0.75h

## Configuration Examples

### Minimal Configuration

Focus on commitment tracking only:

```json
{
  "company": "MyCompany",
  "commitments": {
    "total": {
      "limit": 40,
      "unit": "hours/week"
    }
  },
  "tagMappings": {}
}
```

### Standard Configuration

Commitment tracking with shortcuts:

```json
{
  "company": "MyCompany",
  "commitments": {
    "development": { "limit": 32, "unit": "hours/week" },
    "meeting": { "limit": 8, "unit": "hours/week" },
    "total": { "limit": 40, "unit": "hours/week" }
  },
  "tagMappings": {
    "dev": "development",
    "sync": "meeting"
  }
}
```

### Full Configuration

Commitment tracking + project breakdown + shortcuts:

```json
{
  "company": "MyCompany",
  "commitments": {
    "development": { "limit": 32, "unit": "hours/week" },
    "meeting": { "limit": 8, "unit": "hours/week" },
    "total": { "limit": 40, "max": 45, "unit": "hours/week" }
  },
  "projects": {
    "Product Development": {
      "tags": ["product"],
      "commitment": "development",
      "description": "Core product features and enhancements"
    },
    "Infrastructure": {
      "tags": ["infra", "devops"],
      "commitment": "development",
      "description": "DevOps, CI/CD, infrastructure work"
    },
    "Client Projects": {
      "tags": ["client", "consulting"],
      "commitment": "development",
      "description": "External client work"
    }
  },
  "tagMappings": {
    "dev": "development",
    "sync": "meeting"
  }
}
```

**Note**: Each project uses unique identifier tags (`product`, `infra`/`devops`, `client`/`consulting`) to ensure clear project tracking.

## Implementation Details

### Aggregation Algorithm

When calculating summaries (from `src/services/summary-calculator.ts`):

```typescript
// For each time entry
for (const entry of entries) {
    for (const tag of entry.tags) {
        // 1. Apply tag mapping
        const mappedTag = tagMappings[tag] || tag;

        // 2. Find commitment
        const commitment = findCommitment(mappedTag, config);
        if (commitment) {
            byCommitment[commitment] += entry.duration;
        }

        // 3. Find project
        const project = findProject(mappedTag, config);
        if (project) {
            byProject[project] += entry.duration;
        }

        // 4. Track raw tag
        byTag[tag] += entry.duration;
    }
}
```

### Finding Commitment

Priority order:

1. **Direct match**: Does the tag name match a commitment name?
2. **Project match**: Is the tag in any project's tag list? Use that project's commitment.
3. **No match**: Entry doesn't count toward any commitment (e.g., `#learn` tag)

### Finding Project

For each project in config:
- If entry has ANY tag that's in the project's `tags` array → match

**Note**: An entry can match multiple projects if it has tags from different projects.

## Benefits of This Design

### 1. Flexibility

Use tags however makes sense for your workflow - the system adapts:
- Quick entry: `#dev #bug` (minimal tags)
- Detailed entry: `#dev #mcp #bug #parser #typescript` (rich metadata)

### 2. No Duplicate Tracking

Each entry's time is counted once per dimension:
- Total time: 2h
- Commitment: 2h to development
- Project: 2h to Time Tracking MCP
- Tags: 2h to each tag present

No double-counting within a dimension.

### 3. Evolving Taxonomy

Easy to add new projects without changing entry format:
- Add project to config
- Start using its identifier tags
- Historical entries with those tags automatically count

### 4. Report Granularity

Get multiple views of the same data:
- **Commitment view**: Am I over my development limit?
- **Project view**: How much time on each project?
- **Tag view**: How much time debugging vs. testing vs. features?

### 5. Shortcuts Without Loss

Type `#dev` daily, see "Development" in reports - best of both worlds.

### 6. Clear Project Identity

By using unique identifier tags for projects (like `#mcp`, `#client`), you get:
- Unambiguous project tracking
- Easy to see which project an entry belongs to
- No confusion between commitment tags and project tags

## Common Patterns

### Pattern: Dual-Tagging for Precision

Tag both the commitment AND the project:

```
- 10:00 Feature work (2h) #dev #client
```

**Why:**
- `#dev` ensures it counts toward development commitment
- `#client` ensures it shows in Client Work project breakdown
- Clear intent in the entry itself

### Pattern: Activity Enrichment

Add activity tags for detailed analysis:

```
- 10:00 Refactoring auth module (3h) #dev #product #refactor
```

**Enables questions like:**
- "How much time spent refactoring this week?" → Check #refactor tag
- "How much product development?" → Check Product Development project
- "Am I over my dev limit?" → Check development commitment

### Pattern: Learning Time

Track learning that doesn't count toward commitments:

```
- 14:00 Reading Rust docs (1h) #learn #rust
```

**Result:**
- Shows in tag breakdown (#learn: 1h)
- Doesn't count toward any commitment limit
- Doesn't match any project (unless you create a "Learning" project)
- Still counted in total hours

### Pattern: Meeting Tracking

Use both generic and specific tags:

```
- 09:00 Daily standup (15m) #sync #team
- 14:00 Client demo (1h) #sync #client
- 16:00 Architecture review (2h) #sync #mcp
```

**Benefits:**
- All count toward meeting commitment (via `#sync` → `#meeting`)
- Client meeting shows in Client Work project
- Can analyze meeting distribution: team vs. client vs. project

### Pattern: Project Identifier Selection

Choose a primary unique tag per project:

```json
{
  "projects": {
    "Time Tracking MCP": {
      "tags": ["mcp"],  // Short, unique, unambiguous
      "commitment": "development"
    },
    "Stellantis Integration": {
      "tags": ["stellantis", "stla"],  // Brand name + abbreviation
      "commitment": "development"
    },
    "HeliMods Internal": {
      "tags": ["helimods", "hm"],  // Company name + abbreviation
      "commitment": "development"
    }
  }
}
```

**Usage:**
```
- 10:00 MCP work (2h) #dev #mcp
- 14:00 Stellantis API (3h) #dev #stla
- 16:00 Internal tooling (1h) #dev #hm
```

Every entry is clearly associated with exactly one project via its identifier tag.

## Troubleshooting

### Entry doesn't count toward commitment

**Check:**
1. Does the tag match a commitment name? (`#development`)
2. Is there a tag mapping? (`#dev` → `development`)
3. Is the tag in a project that links to a commitment?

**If none apply**, the entry tracks total time but not to any specific commitment.

### Entry doesn't show in project breakdown

**Check:**
1. Is the tag in the project's `tags` array?
2. Has tag mapping been applied first? (Project matching uses mapped tags)
3. Did you use the project's unique identifier tag?

**Example issue:**
```json
{
  "tagMappings": { "infra": "infrastructure" },
  "projects": {
    "Infrastructure": {
      "tags": ["infra"]  // ❌ Won't match #infrastructure entries!
    }
  }
}
```

**Fix:** Use the mapped name in project tags OR use the unmapped tag:
```json
{
  "projects": {
    "Infrastructure": {
      "tags": ["infrastructure"]  // ✓ Matches both #infra and #infrastructure
    }
  }
}
```

### Entry shows in wrong project

**Check:**
1. Did you accidentally use a tag that belongs to a different project?
2. Are project identifier tags unique?

**Example issue:**
```json
{
  "projects": {
    "Project A": { "tags": ["client"] },
    "Project B": { "tags": ["client", "consulting"] }
  }
}
```

Entry: `#client` → Matches BOTH projects! ❌

**Fix:** Use unique identifiers:
```json
{
  "projects": {
    "Project A": { "tags": ["clienta"] },
    "Project B": { "tags": ["clientb", "consulting"] }
  }
}
```

### Duplicate hours in reports

**This is normal!** Different breakdowns show different views of the same time:
- 2h total
- 2h in development commitment
- 2h in MCP project
- 2h with #dev tag
- 2h with #mcp tag

All of these are the same 2 hours viewed from different angles.

## Design Principles

### Why Projects Link Tags to Commitments

This indirection provides several benefits:

1. **Semantic clarity**: `#mcp` is more meaningful than `#development` when logging
2. **Flexible grouping**: Multiple projects can share a commitment
3. **Evolution**: Change project→commitment mapping without touching entries
4. **Reporting**: Get both project-level AND commitment-level views

### Why Tag Mappings Exist

1. **Ergonomics**: Type `#dev` instead of `#development` hundreds of times
2. **Consistency**: Mappings ensure `#dev` always means `#development` in reports
3. **Migration**: Can rename tags by mapping old names to new ones

### Why Unique Project Tags Matter

Without unique project identifiers, you get ambiguity:
- Entry: `#dev #bug` → Which project?
- Need to rely on task text parsing (fragile)
- Reports become unclear

With unique project identifiers:
- Entry: `#dev #mcp #bug` → Clearly "Time Tracking MCP" project
- No ambiguity
- Clean, accurate reports

## See Also

- [FORMAT_SPEC.md](../FORMAT_SPEC.md) - Markdown file format specification
- [README.md](../README.md) - Overview and setup guide
- [Configuration schema](../src/config/schema.ts) - TypeScript type definitions

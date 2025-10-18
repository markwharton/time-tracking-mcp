# Time Tracking Markdown Format Specification

**Version:** 1.0
**Status:** Stable
**Last Updated:** 2025-10-18

## Overview

This document specifies the markdown file format used for time tracking data storage. The format is designed to be:
- Human-readable and editable
- Machine-parseable
- Version-controlled (git-friendly)
- Auto-healing (calculated summaries prevent denormalization)

## File Structure

### File Naming

Weekly files follow the ISO 8601 week format:
```
{YEAR}-W{WEEK}.md
```

**Examples:**
- `2025-W42.md` - Week 42 of 2025
- `2025-W01.md` - Week 1 of 2025

### File Location

**Multi-Company Mode** (when `COMPANIES` env var is set):
```
~/Documents/time-tracking/
  {CompanyName}/
    config.json
    2025-W42.md
    2025-W43.md
    audit.log
```

**Single-Company Mode** (when `COMPANIES` env var is NOT set):
```
~/Documents/time-tracking/
  config.json
  2025-W42.md
  2025-W43.md
  audit.log
```

See [Multi-Company Patterns](../architecture/multi-company-patterns.md) for detailed information about both organizational approaches.

## Format Structure

### 1. Format Version Marker (Required)

Every file MUST begin with a format version HTML comment:

```markdown
<!-- time-tracking-format: v1.0 -->
```

**Purpose:** Enables format evolution and migration tooling
**Placement:** First line of file
**Visibility:** Hidden in rendered markdown

### 2. File Header

```markdown
# Time Tracking - {CompanyName} - Week {N} ({Month} {Day}-{Day}, {Year})
```

**Example:**
```markdown
# Time Tracking - HeliMods - Week 42 (Oct 13-19, 2025)
```

### 3. Summary Section

The summary section is **calculated, not stored**. It is regenerated on every write operation.

```markdown
## Summary
- **Total:** {X}h / {limit}h limit ({percent}%)
- **{Commitment}:** {X}h / {limit}h ({percent}%)
- **Remaining:** {X}h available

---
```

**Calculation rules:**
- Total = sum of all entry durations
- Commitments = sum of entries with tags mapped to that commitment
- Remaining = limit - total (minimum 0)
- Percentages rounded to nearest integer

**Warning indicators:**
- `⚠️ OVER` - Over commitment limit
- `⚠️ OVERFLOW (Xh into Yh max buffer)` - Over limit but under max
- `🚨 EXCEEDED MAX (Xh over Yh maximum)` - Over maximum

### 4. Spacing Rules (Auto-normalized)

The system automatically enforces consistent spacing on every file write to maintain readability while preserving user content.

**Spacing rules:**
1. **One blank line after title** - Between `# Time Tracking...` and `## Summary`
2. **One blank line before Summary** - Already covered by rule 1
3. **One blank line after separator** - After `---` before first day section
4. **One blank line after day headers** - After `## 2025-10-19 Sunday (Xh)` before entries
5. **No blank lines between entries** - Consecutive time entries have no spacing
6. **One blank line before day sections** - Between last entry and next `## YYYY-MM-DD`
7. **Blank line before user content** - Prevents confusion with entries above
8. **Blank line after user content** - Prevents confusion with entries below

**When normalization runs:**
- Automatically on every time entry log operation
- Processes entire file, fixing both new and existing formatting
- Preserves all user content (freeform notes, comments)
- Removes excessive consecutive blank lines

**Example normalized spacing:**
```markdown
# Time Tracking - HeliMods - Week 42 (Oct 13-19, 2025)

## Summary
- **Total:** 5h

---

## 2025-10-19 Sunday (3h)

- 10:00 task 1 (1h)
- 11:00 task 2 (1h)
- 12:00 task 3 (1h)

## 2025-10-18 Saturday (2h)

- 14:00 task 4 (1h)
- 15:00 task 5 (1h)

User notes or freeform content goes here
```

**Benefits:**
- Files remain readable even with manual edits
- Consistent formatting across all companies and weeks
- User content clearly separated from time entries
- No manual formatting maintenance required

### 5. Day Sections

Day sections group entries by date in reverse chronological order (most recent first).

```markdown
## {YYYY-MM-DD} {DayName} ({total}h)

- {HH:MM} {task description} ({duration}h) #{tag1} #{tag2}
- {HH:MM} {task description} ({duration}h) #{tag1}
```

**Example:**
```markdown
## 2025-10-17 Friday (10.1h)

- 23:22 Time Tracking MCP (2h) #development #mcp
- 20:50 capability chronicles (1h) #meeting
- 18:02 development (1h)
```

## Entry Format

### Standard Format

```
- {HH:MM} {task} ({duration}h) #{tag1} #{tag2} ...
```

**Components:**
1. **Bullet:** `-` (hyphen + space)
2. **Time:** `HH:MM` in 24-hour format
3. **Space:** Single space separator
4. **Task:** Free-form text description (greedy match, supports parentheses in task names)
5. **Space:** Single space separator
6. **Duration:** `(Xh)` or `(X.Yh)` in parentheses
   - Must be hours with optional decimal
   - Examples: `(2h)`, `(1.5h)`, `(0.3h)`
7. **Tags (optional):** Space-separated hashtags
   - Format: `#tagname` (alphanumeric + underscore + hyphen)
   - Examples: `#development`, `#time-tracking-mcp`

### Flexible Duration Format (Optional)

When `FLEXIBLE_DURATION_PARSING=true`, additional duration formats are accepted:

**Input formats:**
- `(30m)` - Minutes
- `(2 hours)` - Natural language
- `(90 minutes)` - Natural language
- `(PT2H30M)` - ISO 8601 duration

**Normalization:**
All flexible formats are automatically converted to standard `(Xh)` format on next write.

**Example:**
```markdown
# Manual edit:
- 14:30 meeting (90 minutes) #meeting

# After next recalculation:
- 14:30 meeting (1.5h) #meeting
```

## Regex Patterns

### Strict Parsing (Default)

```regex
^- (\d{2}:\d{2}) (.+) \((\d+(?:\.\d+)?)h\)(.*)?$
```

**Captures:**
1. Time: `HH:MM`
2. Task: Greedy text (backtracks to find last duration match, supports parentheses in task)
3. Duration: Decimal hours
4. Tags: Remaining text (parsed for `#\w+`)

**Note:** The greedy `.+` allows task names to contain parentheses (e.g., `"debugging (part 1)"`). The regex engine backtracks to find the last occurrence of the duration pattern.

### Flexible Parsing (Optional)

```regex
^- (\d{2}:\d{2}) (.+) \((.+?)\)(.*)?$
```

**Captures:**
1. Time: `HH:MM`
2. Task: Greedy text (backtracks to find last duration match, supports parentheses in task)
3. Duration: Any text (passed to duration parser)
4. Tags: Remaining text

**Note:** Same greedy matching as strict parsing, but duration can be any parseable format.

## Tag System

### Tag Format

Tags are hashtag-prefixed identifiers:
- Start with `#`
- Alphanumeric characters, underscores, hyphens
- Case-sensitive
- No spaces

**Valid:**
- `#development`
- `#time-tracking-mcp`
- `#meeting_notes`
- `#Q4`

**Invalid:**
- `#with spaces` (spaces)
- `development` (missing #)
- `#special!chars` (special characters)

### Tag Purposes

1. **Commitment Mapping:** Tags map to commitment categories via config
2. **Project Assignment:** Tags map to projects via config
3. **Visibility:** All tags tracked in summary even if unmapped

## Configuration Schema

See `config.json` in each company directory.

**Key fields:**
- `commitments` - Hour limits and categories
- `projects` - Project definitions with tags and commitment mappings
- `tagMappings` - Shortcuts (e.g., "dev" → "development")

## Auto-Healing Behavior

The format is designed to auto-heal on write operations:

1. **Summaries recalculated** - Always accurate, even after manual edits
2. **Day totals updated** - Header totals match entry sums
3. **Durations normalized** - Flexible formats converted to standard
4. **Invalid entries skipped** - Unparsed lines ignored with warnings

**Example:**
```markdown
# You manually edit:
- 14:30 task (BAD FORMAT)
- 15:00 valid task (1h)

# Next write operation:
- Ignores "BAD FORMAT" line
- Recalculates totals based on valid entries only
- Warns about unparsed line
```

## Validation

### Parse Warnings

The parser tracks and reports issues:

1. **Unparsed lines** - Entry lines that don't match regex
2. **Format version** - Missing or mismatched version markers
3. **Invalid durations** - Duration strings that can't be parsed

**Warning output:**
```
⚠️ Parse Warnings:
• Found 2 unparsed entry line(s)
• No format version marker found (pre-v1.0 file)

Unparsed lines:
  Line 23: - 14:30 task with (bad format
  Line 45: - not a valid entry
```

## Audit Log

Every time entry operation is logged to an append-only audit log.

### Audit Log Location

```
~/Documents/time-tracking/{CompanyName}/audit.log
```

### Audit Log Format

```
# Time Tracking Audit Log
# Format: ISO8601_TIMESTAMP | OPERATION | DATE | TIME | DURATION | TASK | TAGS
# audit-log-format: v1.0

2025-10-18T14:30:00.000Z | ADD | 2025-10-18 | 14:30 | 2.00h | Security review | #development #security
2025-10-18T15:45:00.000Z | ADD | 2025-10-18 | 15:45 | 1.50h | Client meeting | #meeting
```

**Fields:**
1. **Timestamp:** ISO 8601 UTC timestamp
2. **Operation:** `ADD`, `EDIT`, or `DELETE`
3. **Date:** Entry date (YYYY-MM-DD)
4. **Time:** Entry time (HH:MM)
5. **Duration:** Decimal hours (X.XXh)
6. **Task:** Task description
7. **Tags:** Space-separated hashtags or "no-tags"

**Delimiter:** ` | ` (space-pipe-space)

### Audit Log Properties

- **Append-only:** Entries never deleted or modified
- **Immutable record:** Complete history of all operations
- **Recovery:** Can reconstruct state at any point in time
- **Debugging:** Track down data corruption or loss

## Version Evolution

### Format Version: v1.0 (Current)

**Changes from pre-versioned:**
- Added format version marker
- Added parse validation with warnings
- Added audit log
- Documented standard

### Future Versions

**Backward compatibility guarantee:**
- Old files without version markers will parse as "pre-v1.0"
- Parsers will handle all versions gracefully
- Auto-healing will preserve data during format migrations

**Adding new features:**
- Minor features: Add optional syntax (e.g., `[project:Name]`)
- Major breaking changes: Increment version, provide migration tool

## Edge Cases

### Empty Files

Valid minimal file:
```markdown
<!-- time-tracking-format: v1.0 -->
# Time Tracking - Company - Week 42 (Oct 13-19, 2025)

## Summary
- **Total:** 0h

---
```

### Manual Edits

The format supports manual editing:
- Add entries by inserting lines
- Delete entries by removing lines
- Edit tasks/durations/tags inline
- Next write operation will recalculate summaries

### Concurrent Writes

**Not supported** - The MCP server is single-threaded per user, preventing concurrent writes. For multi-user scenarios, implement file locking.

### Line Breaks in Task Names

Task names with line breaks are not supported and will break parsing. Task descriptions should be single-line.

## Best Practices

### For Users

1. **Backup via git:** Keep time-tracking directory in version control
2. **Manual edits:** Make small, incremental changes
3. **Validation:** Check for warnings after manual edits
4. **Audit log:** Never delete audit.log (immutable record)

### For Developers

1. **Parse validation:** Always check `getParseIssues()` after parsing
2. **Auto-heal:** Trust the recalculation, don't store summaries
3. **Regex updates:** Test thoroughly, formats are user-facing
4. **Version markers:** Always include in new files

## Examples

### Complete Week File

```markdown
<!-- time-tracking-format: v1.0 -->
# Time Tracking - HeliMods - Week 42 (Oct 13-19, 2025)

## Summary
- **Total:** 23.7h / 25h limit (95%)
- **Development:** 13.5h / 20h (68%)
- **Meeting:** 6h / 5h (120%) ⚠️ OVER
- **Remaining:** 1.3h available

---

## 2025-10-18 Saturday (0.5h)

- 00:03 discussing issue reporting with Jon B (0.5h)

## 2025-10-17 Friday (23.2h)

- 23:22 Time Tracking MCP (2h) #development #mcp
- 23:18 project work (2h) #development
- 22:20 documentation (1h)
- 20:50 capability chronicles (1h) #meeting
- 18:02 development (1h)
- 06:46 documentation (0.3h) #development
- 05:52 MCP server (1h) #development
```

### Mixed Format (with flexible parsing enabled)

```markdown
<!-- time-tracking-format: v1.0 -->
# Time Tracking - HeliMods - Week 42 (Oct 13-19, 2025)

## Summary
- **Total:** 5h / 25h limit (20%)
- **Development:** 5h / 20h (25%)
- **Remaining:** 20h available

---

## 2025-10-18 Saturday (5h)

- 14:30 security review (2h) #development
- 16:00 client call (90 minutes) #meeting
- 17:30 debugging (PT1H30M) #development

<!-- Next write will normalize to standard format -->
```

## References

- ISO 8601 Week Date: https://en.wikipedia.org/wiki/ISO_week_date
- ISO 8601 Duration: https://en.wikipedia.org/wiki/ISO_8601#Durations
- Markdown Spec: https://commonmark.org/

## See Also

- [Development Guide](../guides/development.md) - Working with the codebase
- [Tag System Guide](../architecture/tag-system.md) - Tag implementation details

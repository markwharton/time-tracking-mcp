# Input Validation Rules

This document describes all input validation rules enforced by the Time Tracking MCP server to ensure data integrity and security.

## Overview

All user inputs are validated to prevent:
- Data corruption from invalid values
- Security issues from injection attacks or path traversal
- Logical errors from out-of-range values

---

## Duration Validation

**Location:** `src/services/duration-parser.ts`

### Rules

| Rule | Value | Reason |
|------|-------|--------|
| **Minimum Duration** | 5 minutes (0.08h) | Prevents accidental micro-entries |
| **Maximum Duration** | 24 hours | Prevents unrealistic per-entry durations |
| **No Negative Values** | Must be positive | Durations cannot be negative |
| **Finite Values Only** | No Infinity/NaN | Ensures valid calculations |

### Supported Formats

✅ **Valid Formats:**
```
2h              → 2 hours
90m             → 90 minutes (1.5h)
2.5h            → 2.5 hours
half an hour    → 0.5 hours
quarter hour    → 0.25 hours
PT2H30M         → ISO 8601 (2.5 hours)
```

❌ **Invalid Examples:**
```
1m              → Too short (< 5 min)
25h             → Too long (> 24h)
-5h             → Negative value
abc             → Invalid format
```

### Error Messages

```
Duration too short: "1m". Minimum duration is 5 minutes (0.08h)
Duration too long: "25h". Maximum duration is 24 hours per entry
Duration cannot be negative: "-5h"
Unable to parse duration: "abc". Try formats like "2h", "90m", or "1.5h"
```

---

## Task Description Validation

**Location:** `src/utils/string-utils.ts`

### Rules

| Rule | Behavior | Reason |
|------|----------|--------|
| **Trim Whitespace** | Automatic | Clean input |
| **Newlines → Spaces** | `\n` → ` ` | Single-line entries |
| **Multiple Spaces → Single** | `"a    b"` → `"a b"` | Normalized formatting |
| **Remove Header Markers** | `"## Task"` → `"Task"` | Prevent markdown structure breaks |
| **Remove List Markers** | `"- Task"` → `"Task"` | Prevent markdown structure breaks |
| **Maximum Length** | 500 characters | Reasonable entry size |
| **No Empty Tasks** | Must have content | Meaningful entries |

### Examples

✅ **Valid & Sanitized:**
```
Input:  "  Review PR  "
Output: "Review PR"

Input:  "Fix\nbug"
Output: "Fix bug"

Input:  "## Important Task"
Output: "Important Task"

Input:  "Fix bug (issue #123)"
Output: "Fix bug (issue #123)"  [preserved]

Input:  "##ticket-123"
Output: "##ticket-123"  [preserved - no space after ##]
```

❌ **Invalid Examples:**
```
""                    → Task description cannot be empty
"   "                 → Task description cannot be empty after sanitization
[501+ characters]     → Task description too long (501 chars). Maximum 500 characters
```

---

## Date Validation

**Location:** `src/utils/date-utils.ts`

### Rules

| Format | Example | Behavior |
|--------|---------|----------|
| **today** | `"today"` | Current date |
| **yesterday** | `"yesterday"` | Previous day |
| **ISO Format** | `"2025-10-17"` | Specific date (YYYY-MM-DD) |
| **Invalid Format** | `"invalid"` | ❌ Throws error |

### Examples

✅ **Valid:**
```
"today"           → Current date
"yesterday"       → Yesterday
"2025-10-17"      → October 17, 2025
```

❌ **Invalid:**
```
"invalid-date"    → Unable to parse date: "invalid-date".
                     Use format: "today", "yesterday", or "YYYY-MM-DD"
```

**Note:** JavaScript's Date constructor is permissive - malformed ISO dates like `"2025-13-45"` will parse but may roll over to unexpected dates. This is accepted behavior.

---

## Time Validation

**Location:** `src/utils/date-utils.ts`

### Supported Formats

| Format | Example | Result |
|--------|---------|--------|
| **HH:MM** | `"14:30"` | 2:30 PM |
| **Relative** | `"2 hours ago"` | 2 hours before now |
| **Contextual** | `"morning"` | 9:00 AM |
| **Contextual** | `"afternoon"` | 2:00 PM |
| **Contextual** | `"evening"` | 6:00 PM |

### Examples

✅ **Valid:**
```
"14:30"           → 2:30 PM
"2 hours ago"     → 2 hours before now
"morning"         → 9:00 AM
"afternoon"       → 2:00 PM
```

❌ **Invalid:**
```
"invalid-time"    → Unable to parse time: "invalid-time".
                     Use format: "HH:MM" (e.g., "14:30"),
                     "X hours ago", or "morning/afternoon/evening"
```

---

## Company Name Validation

**Location:** `src/utils/company-resolver.ts`

### Security Rules

| Rule | Value | Reason |
|------|-------|--------|
| **No Path Traversal** | No `..`, `/`, `\` | Prevent directory traversal attacks |
| **No Hidden Files** | Cannot start with `.` | Prevent hidden file access |
| **No Empty Names** | Must have content | Valid identifier required |
| **Maximum Length** | 100 characters | Reasonable name size |

### Examples

✅ **Valid:**
```
"CompanyName"     → Valid
"Company123"      → Valid
"My-Company"      → Valid
```

❌ **Invalid:**
```
"../etc"          → Company names cannot contain path separators or '..'
"company/test"    → Company names cannot contain path separators or '..'
".hidden"         → Company names cannot start with '.'
""                → Company name cannot be empty
[101+ chars]      → Company name too long (101 chars). Maximum 100 characters
```

**Validation runs at server startup** - invalid company names in configuration will prevent server from starting.

---

## Week Number Validation

**Location:** `src/utils/date-utils.ts`

### Rules

| Rule | Value | Reason |
|------|-------|--------|
| **Year Range** | 1900-2200 | Reasonable historical/future range |
| **Must Be Integer** | No decimals | Week numbers are whole numbers |
| **Minimum Week** | 1 | Weeks start at 1 |
| **Maximum Week** | 52 or 53 | Depends on year |

### ISO Week System

- Most years have **52 weeks**
- Years starting on Thursday have **53 weeks**
- Leap years starting on Wednesday have **53 weeks**

### Examples

✅ **Valid:**
```
validateWeekNumber(2025, 1)    → Pass (Week 1)
validateWeekNumber(2025, 52)   → Pass (Week 52)
validateWeekNumber(2026, 53)   → Pass (2026 has 53 weeks)
```

❌ **Invalid:**
```
validateWeekNumber(2025, 0)    → Week number must be a positive integer, got: 0
validateWeekNumber(2025, 53)   → Week 53 is invalid for year 2025.
                                  Year 2025 has 52 weeks (valid range: 1-52)
validateWeekNumber(1800, 1)    → Year 1800 is outside valid range (1900-2200)
validateWeekNumber(2025, 1.5)  → Week number must be a positive integer, got: 1.5
```

---

## Configuration Validation

**Location:** `src/services/markdown-manager.ts`

### Config File (JSON)

The system validates JSON syntax when loading configuration files.

✅ **Valid:**
```json
{
  "company": "MyCompany",
  "commitments": {
    "total": { "limit": 40, "unit": "hours/week" }
  }
}
```

❌ **Invalid:**
```json
{
  "company": "MyCompany"
  "commitments": {  // ← Missing comma
    "total": { "limit": 40, "unit": "hours/week" }
  }
}
```

**Error Message:**
```
Invalid JSON in config file: /path/to/config.json.
Unexpected token 'c', ..."MyCompany"␊  "commitments": {  "... is not valid JSON
```

---

## Validation Flow

All validations follow this pattern:

1. **Parse** - Convert string input to structured data
2. **Validate** - Check against rules
3. **Sanitize** - Clean/normalize (where applicable)
4. **Error** - Throw descriptive error if invalid

### Error Handling

All validation errors:
- ✅ Throw exceptions (no silent fallbacks)
- ✅ Provide clear, actionable error messages
- ✅ Include examples of valid formats
- ✅ Are caught by tool error handler and returned to user

---

## Testing

All validation rules are tested. Run tests with:

```bash
npm test
```

**Test Coverage:**
- ✅ 57 tests across 16 suites
- ✅ Duration validation (min/max/negative/formats)
- ✅ Date/time parsing (valid/invalid formats)
- ✅ Task sanitization (all rules)
- ✅ Company name security (path traversal)
- ✅ Week number validation (range/ISO weeks)

See `test/` directory for full test suite.

---

## Summary

### Design Principles

1. **Fail Fast** - Invalid input throws errors immediately
2. **Clear Errors** - Error messages explain what's wrong and how to fix it
3. **No Silent Fallbacks** - All parsing errors are surfaced to the user
4. **Security First** - Path traversal and injection attacks are blocked
5. **Reasonable Limits** - Constraints prevent accidental misuse

### Quick Reference

| Input Type | Min | Max | Special Rules |
|------------|-----|-----|---------------|
| Duration | 5 min | 24h | Positive, finite |
| Task | 1 char | 500 chars | Sanitized, no markdown headers |
| Company Name | 1 char | 100 chars | No path separators, no leading `.` |
| Week Number | 1 | 52-53 | Integer, year-dependent |
| Year | 1900 | 2200 | Reasonable range |

---

**Last Updated:** 2025-10-19
**Version:** 0.1.2

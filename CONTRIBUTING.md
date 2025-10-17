# Contributing to Time Tracking MCP

## Development Setup

```bash
git clone <repo-url>
cd time-tracking-mcp
npm install
```

## Project Structure

- `src/` - TypeScript source code
    - `tools/` - MCP tool definitions
    - `services/` - Business logic
    - `utils/` - Shared utilities
    - `types/` - TypeScript types
    - `config/` - Configuration handling
- `docs/` - Documentation
- `dist/` - Compiled JavaScript (generated)

## Development Commands

```bash
npm run dev        # Auto-reload development mode
npm run build      # Compile TypeScript
npm run rebuild    # Clean build
npm test           # Run tests (when added)
```

## Adding a New Tool

1. **Create tool file** in `src/tools/`:

```typescript
// src/tools/my-new-tool.ts
import { registerTool } from './registry.js';
import { createTextResponse, withErrorHandler } from '../utils/tool-response.js';

registerTool({
    name: 'my_new_tool',
    description: `Description that helps Claude understand when to use this tool.
    
    Natural language examples Claude should handle:
    - "Example user query"
    - "Another example"`,
    inputSchema: {
        type: 'object',
        properties: {
            param1: {
                type: 'string',
                description: 'Parameter description'
            }
        },
        required: ['param1']
    },
    annotations: {
        title: 'My New Tool',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    },
    handler: withErrorHandler('doing my task', async (args) => {
        // Implementation
        return createTextResponse('Result');
    })
});
```

2. **Import in server.ts**:

```typescript
import './tools/my-new-tool.js';
```

3. **Rebuild**:

```bash
npm run rebuild
```

4. **Test** in Claude Desktop

## Coding Standards

### TypeScript

- Use strict mode (already configured)
- Explicit return types on exported functions
- Use interfaces for data structures
- Avoid `any` - use `unknown` if truly dynamic

### Error Handling

Always use `withErrorHandler` wrapper:

```typescript
handler: withErrorHandler('context', async (args) => {
    // Your code - errors are caught automatically
})
```

### File I/O

Use utilities from `utils/file-utils.ts`:

```typescript
import { readFileIfExists, writeFileSafe, readJSON } from '../utils/file-utils.js';

// Safe read (returns null if not found)
const content = await readFileIfExists(path);

// Safe write (creates directories)
await writeFileSafe(path, content);

// JSON helpers
const config = await readJSON<MyType>(path);
await writeJSON(path, data);
```

### Date/Time Handling

Use utilities from `utils/date-utils.ts`:

```typescript
import { now, formatDate, formatTime, parseDate } from '../utils/date-utils.js';

// Current time in configured timezone
const currentTime = now();

// Parse natural language
const date = parseDate('yesterday');  // Date object
const time = parseTime('2 hours ago'); // Date object

// Format for display
const dateStr = formatDate(date);  // "2025-10-17"
const timeStr = formatTime(time);  // "14:30"
```

## Testing

### Manual Testing

1. Build the project
2. Update Claude config
3. Restart Claude Desktop
4. Test natural language queries

### Adding Unit Tests

```bash
npm install --save-dev @types/jest jest ts-jest
```

Create test files alongside source:

```typescript
// src/services/duration-parser.test.ts
import { parseDuration } from './duration-parser.js';

describe('parseDuration', () => {
    it('parses hours', () => {
        expect(parseDuration('2h')).toEqual({ hours: 2, formatted: '2h' });
    });
});
```

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add monthly report tool
fix: correct duration parsing for fractional hours
perf: optimize summary calculations
docs: update usage examples
refactor: extract date parsing utilities
```

Types:
- `feat` - New features
- `fix` - Bug fixes
- `perf` - Performance improvements
- `refactor` - Code restructuring
- `docs` - Documentation only
- `test` - Adding tests
- `chore` - Build/tooling changes

## Releasing

```bash
# Patch version (0.1.0 → 0.1.1)
npm run release

# Minor version (0.1.0 → 0.2.0)
npm run release:minor

# Major version (0.1.0 → 1.0.0)
npm run release:major

# Preview without committing
npm run release:dry
```

This will:
1. Bump version in package.json
2. Update CHANGELOG.md
3. Create git commit
4. Create git tag
5. Push to remote (if postrelease hook enabled)

## Architecture Guidelines

### Separation of Concerns

- **Tools** - MCP interface, parameter validation
- **Services** - Business logic, file operations
- **Utils** - Reusable helpers
- **Types** - Shared interfaces

### Single Responsibility

Each module should do one thing well:

```typescript
// Good: Focused service
class MarkdownManager {
    async addEntry() { }
    async getWeeklySummary() { }
}

// Bad: God object
class TimeTracker {
    async addEntry() { }
    async parseDate() { }
    async formatOutput() { }
    async calculateTaxes() { }
}
```

### Data Flow

```
User (natural language)
  ↓
Claude (parses intent)
  ↓
Tool (validates parameters)
  ↓
Service (implements logic)
  ↓
Utils (helpers)
  ↓
Storage (markdown files)
  ↓
Response (formatted text)
  ↓
Claude (presents to user)
```

### State Management

- **Stateless tools** - Each call is independent
- **File-based state** - Markdown files are source of truth
- **No caching** - Recalculate summaries on read (files are small)

### Error Handling Strategy

1. **Validation errors** - Return helpful message to user
2. **File I/O errors** - Catch and explain what failed
3. **Parse errors** - Provide examples of valid formats
4. **Unknown errors** - Log for debugging, show generic message

```typescript
// Good error handling
if (!isValidDuration(input)) {
    throw new Error(`Unable to parse duration: "${input}". Try formats like "2h", "90m", or "1.5h"`);
}

// Bad error handling
if (!isValidDuration(input)) {
    throw new Error('Invalid input');
}
```

## Common Tasks

### Adding a New Duration Format

1. Update `parseDuration` in `src/services/duration-parser.ts`
2. Add test cases
3. Update documentation

### Adding a New Company

Users can do this themselves:

```bash
mkdir ~/Documents/time-tracking/newcompany
# Create config.json
# Update Claude config COMPANIES env var
```

### Changing Markdown Format

⚠️ **Breaking change** - requires migration

1. Update `MarkdownManager`
2. Create migration script
3. Document in CHANGELOG
4. Bump major version

### Adding Timezone Support

Already implemented! Just set env vars:

```json
{
  "env": {
    "DISPLAY_TIMEZONE_OFFSET": "10",
    "DISPLAY_TIMEZONE_STRING": "AEST"
  }
}
```

## Debugging

### Enable Verbose Logging

```typescript
// Add to tool handler
console.error('[Time Tracking MCP] Debug info:', { args, result });
```

### Check Claude Logs

```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

### Test Markdown Parsing

Create a test file and verify parsing:

```typescript
const manager = new MarkdownManager();
const summary = await manager.getWeeklySummary('helimods', 2025, 42);
console.log(summary);
```

### Inspect Generated Files

```bash
cat ~/Documents/time-tracking/helimods/2025-week-42.md
```

## Performance Considerations

### File Size

Week files are typically < 10KB:
- 50 entries/week = ~5KB
- Read time: < 1ms
- Write time: < 5ms

### Calculation Performance

Summary calculation is O(n) where n = entries:
- 50 entries: < 1ms
- 500 entries: < 10ms
- No optimization needed

### Memory Usage

Entire MCP server: < 50MB RSS
- Small footprint
- No memory leaks (stateless)
- Files read/released immediately

## Security Considerations

### Local Only

- No network calls
- No cloud storage
- No authentication needed

### File Permissions

Uses OS file system permissions:
- User's home directory
- Standard file permissions

### Input Validation

Always validate user input:

```typescript
// Good
if (typeof args.duration !== 'string') {
    throw new Error('Duration must be a string');
}

// Bad
const duration = args.duration; // Could be anything!
```

### Path Traversal

Prevent directory traversal:

```typescript
// Good - use Path.join
const filePath = join(baseDir, company, filename);

// Bad - string concatenation
const filePath = baseDir + '/' + company + '/../../../etc/passwd';
```

## Documentation Standards

### Tool Descriptions

Include natural language examples:

```typescript
description: `Log a time entry.

Natural language examples Claude should parse:
- "2h on security review"
- "Just finished 90 minutes on client meeting"

Claude should extract: task, duration, optional time/date/tags.`
```

### Code Comments

Comment the "why", not the "what":

```typescript
// Good
// Parse relative time to handle "2 hours ago" style input
const time = parseTime(timeStr);

// Bad
// Parse time string
const time = parseTime(timeStr);
```

### README Updates

When adding features:
1. Update README.md
2. Add to usage-examples.md
3. Update CHANGELOG.md

## Pull Request Process

1. **Branch** from main: `feature/my-feature`
2. **Commit** following conventions
3. **Test** thoroughly in Claude Desktop
4. **Document** changes (README, CHANGELOG)
5. **PR** with description of what/why

### PR Template

```markdown
## What
Brief description of changes

## Why
Problem being solved or feature needed

## Testing
How was this tested?

## Breaking Changes
Any breaking changes? Migration needed?

## Checklist
- [ ] Tested in Claude Desktop
- [ ] Documentation updated
- [ ] Follows coding standards
- [ ] No console.log statements
```

## Future Enhancements

Ideas for contribution:

### High Priority
- [ ] Monthly/yearly reports
- [ ] Export to CSV for invoicing
- [ ] Visualization (charts)
- [ ] Project-level tracking

### Medium Priority
- [ ] Unit tests
- [ ] CLI tool (outside Claude)
- [ ] Migration scripts
- [ ] Multiple timezone support per company

### Low Priority
- [ ] Team/multi-user support
- [ ] Integration with calendar
- [ ] AI-powered insights
- [ ] Mobile app

### Experimental
- [ ] Voice input optimization
- [ ] Auto-categorization of tasks
- [ ] Predictive time estimates
- [ ] Budget tracking

## Questions?

- Check [GETTING-STARTED.md](GETTING-STARTED.md) for setup
- Read [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) for architecture
- See [usage-examples.md](docs/usage-examples.md) for examples

## Philosophy

**Keep it simple.**

This tool should:
- ✅ Do one thing well (time tracking)
- ✅ Have minimal dependencies
- ✅ Be easy to understand
- ✅ Prioritize user workflow
- ✅ Remain hackable

When in doubt, choose simplicity over features.
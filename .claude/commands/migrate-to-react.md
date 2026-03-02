Convert an Ember source file to its React equivalent as part of the Ember→React migration of the Presence app.

## How to invoke
`/migrate-to-react <path-to-ember-file>`

If no path is provided, ask the user which file to convert.

## Instructions

You are performing one focused file conversion. Do the following steps in order:

### 1. Read context files first
Read these two files before doing anything else:
- `EMBER_REACT_PATTERNS.md` — the migration patterns reference for this codebase
- `MIGRATION_STATUS.md` — current migration progress tracker

### 2. Read the target Ember file
Read the file the user specified. If it's a component, also read its `.hbs` template (same name, under `app/templates/components/`). If it's a route, read its template under `app/templates/`.

### 3. Determine the output location
Use this mapping to determine where the React output file goes in the new `src/` directory:

| Ember source | React destination |
|---|---|
| `app/components/foo/component.js` + `app/templates/components/foo.hbs` | `src/components/Foo.jsx` |
| `app/services/foo.js` | `src/hooks/useFoo.js` or `src/context/FooContext.jsx` |
| `app/routes/cmd-foo.js` | `src/routes/CmdFoo.jsx` |
| `app/constants/foo.js` | `src/constants/foo.js` (copy as-is, no changes needed) |
| `app/router.js` | `src/router.jsx` |

For services: use a hook (`useFoo.js`) when the service is used by one component tree. Use Context (`FooContext.jsx`) when the service provides shared app-wide state (like `input-processor` or `story-core`).

### 4. Write the converted file
Apply the patterns from `EMBER_REACT_PATTERNS.md`. Key rules:
- **Preserve all logic exactly** — do not refactor, simplify, rename, or reorganize business logic
- Do not add comments or docstrings that weren't in the original
- Do not add TypeScript
- Do not add error handling that wasn't in the original
- Do not add features or change behavior
- Use React 18, React Router v6, no external state libraries
- Replace Ember utilities (`isPresent`, `set`, `get`, `computed`, `htmlSafe`, `findBy`, `mapBy`) with native JS equivalents per the patterns doc
- Replace `this.$()` DOM access with `useRef`
- Replace lifecycle hooks with `useEffect`
- Replace service injection with hook calls or props

### 5. If converting story-core.js (special case)
This is 41KB of game logic. Approach:
- The reducer function should be a pure function: `storyReducer(state, action) → newState`
- All `set(this, 'property', value)` calls in the service become dispatch actions
- Create an `initialState` object from all the properties initialized in `init()`
- The Context provider wraps the dispatch + state
- Do NOT try to read and convert this in a single pass — read it in chunks (first 100 lines, next 100, etc.) and build the reducer incrementally

### 6. Update MIGRATION_STATUS.md
After writing the output file, mark the source file as ✅ Done in `MIGRATION_STATUS.md`, recording the output path.

### 7. Report back
Tell the user:
- The source file converted
- The output file path written
- Any issues, ambiguities, or decisions you made during conversion
- What to check manually (e.g., canvas API usage, event listener cleanup, stale closure risks)

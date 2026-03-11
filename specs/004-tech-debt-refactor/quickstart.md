# Quickstart: Tech Debt Refactor Branch

**Branch**: `004-tech-debt-refactor`

---

## Prerequisites

- Node.js 20 LTS
- npm 9+

## First-Time Setup

```bash
# From repo root
npm install
```

## Development

```bash
# Frontend dev server (React + Vite)
npm run dev -w frontend
# → http://localhost:5173

# API server (Node/Express)
npm run dev -w api
```

## Type Checking

```bash
# Check frontend types (strict mode)
npm run typecheck -w frontend

# Check all workspaces
npm run typecheck --workspaces --if-present
```

## Running Tests

```bash
# Run all tests
npm test --workspaces --if-present

# Run frontend tests only
npm test -w frontend

# Run frontend tests in watch mode
npm run test:watch -w frontend

# Run with coverage
npm run test:coverage -w frontend
```

## Production Build

```bash
# Build all workspaces in dependency order
npm run build -w packages/types
npm run build -w api
npm run build -w frontend
```

## Key Directories (post-refactor)

| Path | Purpose |
|---|---|
| `frontend/src/components/canvas/` | Canvas rendering + quality adapter modules |
| `frontend/src/utils/game/` | Decomposed storyCore: gameState, inventory, rooms, flashlight |
| `frontend/src/utils/persistence.ts` | Renamed from usePersistence — plain module, not a hook |
| `frontend/src/reducers/inputReducer.ts` | Pure reducer + typed actions for useInputProcessor |
| `frontend/src/routes/shared/` | Shared gallery navigator + showItemContent utility |
| `frontend/src/types/` | Frontend-specific TypeScript types |
| `frontend/src/tests/` | Vitest test files |
| `docs/archive/` | Archived Ember migration docs |

## Running the Type-Check Gate Locally (mirrors CI)

```bash
npm run typecheck --workspaces --if-present
npm test --workspaces --if-present
npm run build -w packages/types && npm run build -w api && npm run build -w frontend
```

All three must pass with zero errors before opening a PR.

## Canvas Visual Fidelity Verification

After any canvas pipeline change, manually verify visual output at all 8 quality levels:

1. Open the app at `http://localhost:5173`
2. Navigate to a room with text content
3. Open DevTools → Application → localStorage, set `quality-preset` to `high`/`normal`/`low`
4. Capture screenshots at quality levels 0–7 (edit `QUALITY_LADDER` index in DevTools if needed)
5. Compare side-by-side against pre-refactor screenshots
6. Check the verification checklist in the PR description

All 8 levels must be perceptually identical before and after.

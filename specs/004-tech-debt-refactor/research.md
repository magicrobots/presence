# Research: Tech Debt Resolution & Codebase Refactor

**Branch**: `004-tech-debt-refactor` | **Date**: 2026-03-10

---

## 1. Canvas GPU Acceleration — Critical Finding

### Decision
The three existing deformer passes (`_pixelizeBit`, `_shiftPixel`, `_glowEdgesBit`) **cannot** be replaced by `ctx.filter` or any other Canvas 2D GPU API. They remain as pixel loops. FR-015's escape clause ("wherever the native API achieves equivalent or better output") applies — the native API cannot achieve equivalent output for these passes.

### Analysis Per Pass

| Pass | What It Does | Can `ctx.filter` Replace It? | Verdict |
|---|---|---|---|
| `_pixelizeBit` | Per-pixel CRT phosphor triad emulation via RGB channel modulation at pixel-index parity (every 3rd pixel pattern: red emphasis, blue emphasis, brightness) | No — positional per-pixel channel logic requires index awareness | **Keep pixel loop** |
| `_shiftPixel` | Chromatic aberration: reads from `i * positionFactor` offset and blends deltas; only triggers above `brightnessThreshold` | No — conditional spatial offset read at dynamic position; no CSS filter equivalent | **Keep pixel loop** |
| `_glowEdgesBit` | Edge detection via neighbor contrast at dynamic `distance`, then additive falloff glow (near/mid/far) | No — multi-pixel spatial comparison and adaptive-radius diffusion; requires per-pixel neighbor reads | **Keep pixel loop** |

### What GPU APIs We DO Apply (FR-015 compliant)
- `imageSmoothingEnabled = false` — already set on both canvas contexts. Confirm it's set before every `drawImage` call post-refactor.
- `ctx.filter` — applicable only if a new post-processing step is introduced that doesn't require per-pixel logic. None currently exist in the pipeline.
- **Loop optimizations within the pixel loops** (compliant with FR-015's "batch operations" clause):
  - `baseIdx = i * 4` hoisted per iteration (already done — keep)
  - Random value hoisted once per frame (already done — keep)
  - Minimize redundant canvas state changes between frames
  - Avoid unnecessary `getImageData` calls on frames where content hasn't changed

### Rationale
These passes implement proprietary CRT aesthetic algorithms. They are designed to be semantically tied to pixel positions and neighbor relationships in ways that no CSS filter or composite operation can express. The correct GPU path for this kind of work would be WebGL fragment shaders — which are explicitly out of scope per FR-015.

### Alternatives Considered
- **WebGL fragment shaders**: Could replace all three passes. Out of scope per spec.
- **OffscreenCanvas**: Off-thread rendering only. Out of scope per spec.
- **CSS `filter` on the canvas element**: Applies a uniform filter to the entire bitmap — cannot produce per-pixel conditional logic or spatial neighbor access.

---

## 2. TypeScript Migration Strategy

### Decision
Incremental rename-and-type: add `tsconfig.json` with `allowJs: true` / `checkJs: false` so `.ts`/`.tsx` and remaining `.js`/`.jsx` coexist during migration. Vite handles transpilation; `tsc --noEmit` is the CI typecheck gate.

### Recommended `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "references": [{ "path": "../packages/types" }]
}
```

**Key decisions:**
- `noEmit: true` — Vite owns the build; `tsc` is type-check only
- `jsx: "react-jsx"` — React 18 automatic transform; no `import React` needed
- `allowJs: true` + `checkJs: false` — JS files coexist but are not type-checked
- `moduleResolution: "bundler"` — matches Vite's resolution behavior
- `references` — integrates `@presence/types` package for cross-package type sharing

### Required New DevDependencies (frontend)
```json
"typescript": "^5.0.0",
"@types/react": "^18.0.0",
"@types/react-dom": "^18.0.0"
```

### New Scripts (frontend/package.json)
```json
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest"
```

### Migration Order (lowest coupling → highest)
1. `constants/*.js` → `.ts` (pure data, no React deps)
2. `utils/*.js` → `.ts` (pure functions; type deformer pass signatures)
3. `hooks/usePersistence.js` → `utils/persistence.ts` (rename + type)
4. `utils/game/` — new decomposed storyCore modules (written as `.ts` from the start)
5. `hooks/useInputProcessor.js` → `.ts` (after reducer extracted)
6. `components/*.jsx` → `.tsx` (after hooks typed)
7. `routes/*.jsx` → `.tsx` (after components typed)
8. `App.jsx`, `router.jsx`, `main.jsx` → `.tsx`

### useReducer Typed Action Pattern
```typescript
type InputAction =
  | { type: 'SET_FIELDS'; payload: Partial<InputState> }
  | { type: 'SET_CURSOR'; payload: number }
  | { type: 'PUSH_HISTORY'; payload: string }
  | { type: 'EXECUTE'; payload: { command: string; args: string[] } }
  | { type: 'CLEAR' }
  | { type: 'RESET' };

function inputReducer(state: InputState, action: InputAction): InputState {
  switch (action.type) {
    case 'SET_FIELDS': return { ...state, ...action.payload };
    // ... other cases
    default: {
      const _exhaustive: never = action;
      return _exhaustive; // compile-time exhaustiveness check
    }
  }
}
```

### Alternatives Considered
- **Jest + Babel**: Heavier setup; no Vite integration. Rejected in favor of Vitest.
- **Full type-check during `vite build`**: Vite uses esbuild which strips types but doesn't check them. `tsc --noEmit` is the correct separate gate.

---

## 3. Vitest Setup

### Decision
Separate `vitest.config.ts` in the `frontend/` workspace. `jsdom` environment for DOM/Canvas API access. Keep separate from `vite.config.js` to avoid build-config conflicts.

### `frontend/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts'],
    },
  },
});
```

### Required New DevDependencies (frontend)
```json
"vitest": "^2.0.0",
"jsdom": "^24.0.0",
"@testing-library/react": "^15.0.0",
"@testing-library/jest-dom": "^6.0.0"
```

### Monorepo Root Script Updates
```json
"test": "npm test --workspaces --if-present",
"typecheck": "npm run typecheck --workspaces --if-present"
```

### Alternatives Considered
- **Jest**: Requires more configuration for Vite ESM. No native Vite integration. Rejected.
- **Merging into vite.config.js**: Risks build/test config interference. Separate file is cleaner.

---

## 4. storyCore.js Decomposition Map

### Decision
Split into 4 modules under `frontend/src/utils/game/`. Three are required by FR-012; flashlight is cleanly isolated and warrants its own module.

| New Module | Source Lines (approx) | Key Exports |
|---|---|---|
| `gameState.ts` | 277-372, 946-989, 92-94 | `initGameState()`, `reportGameState()`, `handleCompletionEvent()`, `getXp()`, `getMaxXp()`, `getIsNewGame()` |
| `inventoryManager.ts` | 38-70, 212-237, 627-668, 692-944 | `getItemById()`, `canTakeItem()`, `getRoomInventory()`, `useItem()`, `getWeightOfInventory()` |
| `roomNavigator.ts` | 192-246, 374-410, 425-438, 528-572, 615-625 | `getCurrentRoom()`, `getExitDescriptions()`, `getIsExitUnlocked()`, `handlePositionChange()`, `getCurrentRoomDescription()` |
| `flashlightManager.ts` | 30-166 | `hasFlashlight()`, `turnOffFlashlight()`, `useFlashlight()`, `getUserCanSeeInTheDark()` |

**Shared utility** (stays in `utils/`): `_processVariableText()` can move into `utils/text-layout.ts` or remain as a `utils/game/textProcessor.ts` helper.

**Persistence coupling**: All four modules depend on `utils/persistence.ts`. Import directly — no need for an abstraction layer.

---

## 5. useInputProcessor.js Decomposition

### Decision
Extract reducer and prompt renderer to their own files. The keyboard handler remains inline in the hook initially (extract if line count warrants). Eliminate the `stateRef` command mutation workaround via functional dispatch.

### stateRef Fix Strategy
The mutation at lines 583-586 (`stateRef.current = { ...stateRef.current, currentCommand: input }`) exists because `dispatch()` is asynchronous and `_execute()` reads from `stateRef.current`.

**Fix**: Pass the current command as an argument to `_execute()` instead of reading it from the ref:
```typescript
// Before (workaround)
stateRef.current = { ...stateRef.current, currentCommand: input };
_execute(true);
stateRef.current = { ...stateRef.current, currentCommand: savedCmd };

// After (clean)
_execute(true, input); // _execute accepts explicit currentCommand override
```

The cursor-loop `stateRef.current = state` (line 175) is NOT a workaround — it's a standard pattern for keeping setInterval closures fresh. It stays.

### Files to Extract
- `frontend/src/reducers/inputReducer.ts` — state shape + typed actions + pure reducer
- `frontend/src/utils/promptRenderer.ts` — `_computePromptLine1/2`, `_computeCurrExecutionBlock`, `_computeAllDisplayLines` (pure functions, no hooks)

---

## 6. Gallery Navigator Shared Pattern

### Decision
Extract shared gallery navigation logic into `frontend/src/routes/shared/galleryNavigator.ts`.

```typescript
interface GalleryConfig<T> {
  images: T[];
  getImagePath: (item: T, index: number) => string;
  initialResponse: string[];
  additionalCommands?: Record<string, () => string[]>;
}

export function createGalleryEnvironment<T>(config: GalleryConfig<T>): AppEnvironment {
  // Returns standardized appEnvironment with ARROWLEFT/ARROWRIGHT key handlers
  // and wrapping index logic
}
```

**CmdCat/CmdLess**: Extract `showItemContent()` to `frontend/src/routes/shared/showItemContent.ts`.

---

## 7. Ember Artifact Inventory

### Files to Delete
| Path | Type |
|---|---|
| `/ember-cli-build.js` | Ember build config |
| `/testem.js` | Ember test runner |
| `/config/` | Ember environment directory |
| `/vendor/` | Ember vendor directory |
| `/tests/` | Ember QUnit test directory |
| `/.ember-cli` | Ember CLI config (if present) |
| `/.template-lintrc.js` | Ember template linting (if present) |

### Files to Archive (move to `docs/archive/`)
- `MIGRATION_STATUS.md`
- `EMBER_REACT_PATTERNS.md`

### Root `package.json` Script Replacements
| Remove | Replace With |
|---|---|
| `"build": "ember build"` | `"build": "npm run build --workspaces --if-present"` |
| `"start": "ember serve"` | `"start": "npm run dev -w frontend"` |
| `"test": "ember test"` | `"test": "npm test --workspaces --if-present"` |
| `"lint:hbs": "ember-template-lint ."` | (remove) |
| All ember `devDependencies` | (remove entire block) |

### AppVeyor Status
`appveyor.yml` is already React/Vite-focused. No Ember commands found in the CI script itself. The root `package.json` scripts called by AppVeyor must be updated (above) — AppVeyor calls `npm test` and `npm run build` which currently resolve to Ember commands.

---

## 8. Deployment Context

- **CI/CD**: AppVeyor — builds types → api → frontend in dependency order; artifacts frontend/dist/ as zip
- **Deployment target**: AWS S3 (frontend static), AWS Route 53 (DNS routing to CloudFront/S3 distribution)
- **Route 53 configuration**: DNS-layer only; no codebase changes required for this feature
- **Build artifact**: `frontend/dist/` ZIP (already configured in appveyor.yml as artifact `fred`)

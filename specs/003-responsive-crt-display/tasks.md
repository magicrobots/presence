# Tasks: Responsive Full-Window CRT Display

**Input**: Design documents from `/specs/003-responsive-crt-display/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/preferences-api.md ✓, quickstart.md ✓

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every description

---

## Phase 1: Setup (Monorepo Scaffold)

**Purpose**: Establish the `frontend/` + `api/` + `packages/types/` npm workspace structure per plan.md. No user story work can begin until the workspace root and package manifests are in place.

- [x] T001 Create workspace root `package.json`: set `"private": true`, `"workspaces": ["packages/*", "frontend", "api"]`, and top-level scripts (`build`, `typecheck`, `test`) in repo root `package.json`
- [x] T002 Create `packages/types/` package: `packages/types/package.json` (`name: "@presence/types"`, `main: "dist/index.js"`, `types: "dist/index.d.ts"`, build script using `tsc`), `packages/types/tsconfig.json` (`target: ES2020`, `declaration: true`, `strict: true`, `outDir: dist`)
- [x] T003 [P] Scaffold `frontend/` workspace: create `frontend/package.json` (react, react-dom, react-router-dom, vite deps; `"@presence/types": "*"`), move existing `src/` to `frontend/src/` preserving all files
- [x] T004 [P] Scaffold `api/` workspace: create `api/package.json` (express, drizzle-orm, pg, tsup, `"@presence/types": "*"`), `api/tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `module: CommonJS`), `api/.env.example` (DATABASE_URL, NODE_ENV, PORT, LOG_LEVEL)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New magic-number constants that all user story tasks depend on. Only T006 and T012 are hard prerequisites for user story work; they must exist before Phases 3–6 can begin.

**⚠️ REQUIRED before user stories**: T006 and T012 only. The API/DB scaffold tasks (T005, T007–T011) are non-blocking infrastructure that can proceed in parallel with user story phases — they are not prerequisites for any spec.md functional requirement (FR-001 through FR-008 are all frontend/canvas-only; FR-008 persistence is satisfied by localStorage alone per plan.md).

- [ ] T006 Update `frontend/src/constants/magic-numbers.js`: remove `ABSOLUTE_MAX_VIEWPORT_WIDTH`, `MAX_MPF`, `PERFORMANCE_TEST_LENGTH`; add `TARGET_FPS` (30), `TARGET_FPS_HIGH` (60), `TARGET_FPS_LOW` (15), `HEADROOM_FPS` (5), `EVAL_WINDOW_MS` (3000), `STALL_THRESHOLD_MS` (3000), `RESIZE_DEBOUNCE_MS` (200), `CANVAS_ASPECT_RATIO` (4/3); add `QUALITY_LADDER` array — 8 entries (levels 0–7), each entry an object with all 16 knobs per data-model.md Step Ladder Definition table (QUALITY_LADDER lives in this file per plan.md)
- [ ] T012 Update `frontend/vite.config.js`: add `server.proxy` entry routing `/api` → `http://localhost:3001` (changeOrigin: true)

**API/DB Scaffold (non-blocking — run in parallel with user story phases):**

- [ ] T005 [OPTIONAL] Implement shared types in `packages/types/src/index.ts`: `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>` discriminated union; `QualityPreset` union type (`'high' | 'normal' | 'low'`); `UserPreferences` interface; `UpdatePreferencesRequest` interface (see data-model.md Shared Types section). Not required by any spec.md functional requirement; supports future API sync only.
- [ ] T007 [P] [OPTIONAL] Create `api/src/lib/response.ts`: implement `sendSuccess(res, data)` and `sendError(res, message, statusCode, code?)` helper functions using `ApiResponse<T>` envelope from `@presence/types`
- [ ] T008 [P] [OPTIONAL] Create `api/src/db/schema.ts`: define `userPreferences` Drizzle table with columns `id` (serial PK), `username` (varchar 255, not null, unique), `qualityPreset` (varchar 10, not null, default `'normal'`), `createdAt` (timestamptz, defaultNow), `updatedAt` (timestamptz, defaultNow) per data-model.md Drizzle Schema
- [ ] T009 [OPTIONAL] Create `api/src/db/migrations/0001_create_user_preferences.sql`: `CREATE TABLE IF NOT EXISTS user_preferences` with all columns and `CHECK (quality_preset IN ('high','normal','low'))` constraint; create index on `username` per data-model.md Migration File
- [ ] T010 [OPTIONAL] Create `api/src/db/index.ts`: instantiate `pg.Pool` from `process.env.DATABASE_URL`, export `db = drizzle(pool, { schema })`; add `npm run migrate` script to `api/package.json` that applies `.sql` files in `api/src/db/migrations/` in order
- [ ] T011 [OPTIONAL] Create `api/src/index.ts`: initialize Express app, add `express.json()` middleware, mount `GET /health` returning `{ status: 'ok' }`, mount `preferencesRouter` at `/api/preferences`, add 404 and 500 error handler middleware; add `dev` (tsup watch) and `build` (tsup CJS) scripts to `api/package.json`

**Checkpoint**: T006 (magic-numbers.js) and T012 (vite proxy) complete — user story phases (3–6) can begin. API/DB scaffold tasks may continue in parallel.

---

## Phase 3: User Story 1 — Maximum-Size 4:3 Display on Load (Priority: P1) 🎯 MVP

**Goal**: Remove the hardcoded 1200px cap and scale the CRT canvas to the largest 4:3 rectangle that fits the browser window, centered with solid black bars.

**Independent Test**: Load the app at widescreen, square, and portrait window sizes. Verify the canvas is the largest 4:3 rectangle that fits, centered, with solid black bars. No page reload needed.

- [ ] T013 [US1] Rewrite `_computeViewportMeasurements` in `frontend/src/components/IzaComputer.jsx`: use `window.innerWidth` and `window.innerHeight` to compute the largest rectangle with `CANVAS_ASPECT_RATIO` (4/3) that fits the window — `if (w/h >= 4/3) { canvasWidth = h*(4/3); canvasHeight = h } else { canvasWidth = w; canvasHeight = w*(3/4) }`; remove all references to `ABSOLUTE_MAX_VIEWPORT_WIDTH`; guard against degenerate inputs: if computed width or height is ≤ 0, NaN, or non-finite, clamp to a minimum of 1 so the canvas does not break at extreme small window sizes (SC-004 requires correct behavior down to 320×240)
- [ ] T014 [US1] Update layout in `frontend/src/components/IzaComputer.jsx` and its CSS: set the outermost container to `width: 100vw; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center`; apply computed canvas dimensions to the canvas wrapper so black bars fill the remaining space automatically
- [ ] T015 [US1] Ensure both `source-canvas` and `altered-canvas` in `frontend/src/components/IzaComputer.jsx` have their `width` and `height` attributes set to the computed canvas pixel dimensions on every viewport measurement update (both must resize in sync)

**Checkpoint**: CRT display fills the browser window at correct 4:3 ratio across all window shapes. US1 is fully functional and testable.

---

## Phase 4: User Story 2 — Smooth Performance at Maximum Display Size (Priority: P2)

**Goal**: Replace the binary `isPerformantRef` on/off gate with an 8-step quality ladder and a continuous bidirectional rAF adaptation loop that runs for the session lifetime.

**Independent Test**: Expand to a large window and observe frame rate stabilizing near 30fps in DevTools. CPU-throttle mid-session and observe quality reducing; remove throttle and observe quality recovering.

- [ ] T016 [P] [US2] Refactor `_glowEdgesBit` in `frontend/src/utils/deformers.js` to accept a `params` object (`enabled`, `useRandom`, `maxContrast`, `distance`, `falloff: { near, mid, far }`); return early if `!params.enabled`; remove all hardcoded constants from the function body; hoist `rngeezus.getRandomValue` call to once per frame (accept pre-computed value as arg) to eliminate the per-pixel pool lookup
- [ ] T017 [P] [US2] Refactor `_shiftPixel` in `frontend/src/utils/deformers.js` to accept a `params` object (`enabled`, `positionFactor`, `factor`, `brightnessThreshold`); return early if `!params.enabled`; remove all hardcoded constants from the function body
- [ ] T018 [P] [US2] Refactor `_pixelizeBit` in `frontend/src/utils/deformers.js` to accept a `params` object (`adjustmentLarge`, `adjustmentSmall`); remove all hardcoded constants from the function body (this pass never returns early — it always runs)
- [ ] T019 [US2] Refactor `applyAllDeformers` in `frontend/src/utils/deformers.js` to accept `(imageData, qualityLevel)`: look up `QUALITY_LADDER[qualityLevel]` from `magic-numbers.js`; implement outer stride loop with `const baseIdx = i * 4` pre-computation; block-fill skipped pixels by copying sampled pixel RGBA to all skipped neighbors; call `_pixelizeBit`, `_shiftPixel`, `_glowEdgesBit` with their respective param slices from the ladder entry; pass pre-computed random value from hoisted call (depends on T016–T018)
- [ ] T020 [US2] Replace `isPerformantRef` binary gate in `frontend/src/components/IzaComputer.jsx` with `qualityLevelRef` integer (initial value 0 = maximum quality); remove `display:none` toggle logic for `altered-canvas`; remove old `isEvaluatedRef` and 30-frame one-shot evaluation
- [ ] T021 [US2] Implement bidirectional quality evaluation loop in `frontend/src/components/IzaComputer.jsx` rAF callback: track `evalWindowStartTimeRef` and `frameTimesRef` array; every `EVAL_WINDOW_MS` (3000ms) compare average FPS to `targetFpsRef.current`; step `qualityLevelRef` up 1 if FPS below target (quality level 0=max, 7=min — increasing the counter reduces quality), down 1 if FPS above target + `HEADROOM_FPS` (5fps) (decreasing the counter improves quality), clamp to [0, 7]; restart eval window after each adjustment; on any single rAF delta > `STALL_THRESHOLD_MS` immediately set `qualityLevelRef` to 7 (minimum quality) and restart eval window; add comment block documenting the loop algorithm
- [ ] T022 [US2] Wire `qualityLevelRef` into render calls in `frontend/src/components/IzaComputer.jsx`: pass `qualityLevelRef.current` to `applyAllDeformers(imageData, qualityLevelRef.current)`; pass `QUALITY_LADDER[qualityLevelRef.current].displacement.bandCount` to the `_deform` / `_createDisplacement` call (depends on T019, T020, T021)

**Checkpoint**: Quality adaptation runs bidirectionally. FPS stabilizes near 30fps. Emergency degradation triggers on stall. US2 is fully functional and testable.

---

## Phase 5: User Story 3 — Quality Preset Control (Priority: P3)

**Goal**: Expose High/Normal/Low preset selector in cmd-settings; persist selection to localStorage; wire to TARGET_FPS; sync to API best-effort.

**Independent Test**: Open settings, switch presets, observe TARGET_FPS changing and adapter adjusting quality accordingly. Reload — preset is restored from localStorage.

- [ ] T023 [US3] Add `getQualityPreset()` and `setQualityPreset(preset)` to `frontend/src/hooks/usePersistence.js`: read/write `quality_preset` key from the existing `magic-robots-data` localStorage object; default to `'normal'` when key is absent
- [ ] T024 [US3] Add `qualitypreset` command to `frontend/src/routes/CmdSettings.jsx`: with no arg display current preset and available options (high / normal / low); with valid arg call `setQualityPreset(arg)` and confirm; reject invalid values with usage message
- [ ] T025 [US3] Read quality preset on mount in `frontend/src/components/IzaComputer.jsx`: initialize `targetFpsRef` from `getQualityPreset()` mapping (`high` → `TARGET_FPS_HIGH`, `normal` → `TARGET_FPS`, `low` → `TARGET_FPS_LOW`); subscribe to preset changes so that when a new preset is selected: (1) `targetFpsRef` updates immediately to the new FPS target, and (2) `qualityLevelRef` resets to 0 (maximum quality) and the evaluation window restarts — so the adapter re-evaluates from full quality at the new target per FR-008 (depends on T021, T023)
- [ ] T026 [P] [OPTIONAL] Implement `GET /api/preferences` in `api/src/routes/preferences.ts`: validate `username` query param (400 `MISSING_USERNAME` if blank); query `userPreferences` table; return 404 `NOT_FOUND` if no row; return 200 with `UserPreferences` payload; wrap DB call in try/catch and return 500 `INTERNAL_ERROR` on failure; export `preferencesRouter` per contracts/preferences-api.md. Not required for FR-008 acceptance; localStorage (T023) is the source of truth.
- [ ] T027 [P] [OPTIONAL] Implement `PUT /api/preferences` in `api/src/routes/preferences.ts`: validate `username` and `qualityPreset` from request body (400 on missing/invalid); upsert row using Drizzle `.onConflictDoUpdate` on `username`; set `updatedAt: new Date()` in update set; return 200 with saved `UserPreferences` payload per contracts/preferences-api.md. Not required for FR-008 acceptance; future-facing API sync only.
- [ ] T028 [OPTIONAL] Add best-effort `PUT /api/preferences` fetch in `frontend/src/routes/CmdSettings.jsx` preset handler: call `setQualityPreset` (localStorage, immediate) first, then fire-and-forget `fetch('/api/preferences', { method: 'PUT', ... })` with `.catch(() => {})` — localStorage is source of truth, API failure is non-critical (depends on T024, T027)

**Checkpoint**: Preset selector works in settings (T023–T025), persists across sessions via localStorage, TARGET_FPS updates on change. US3 is fully functional and testable without T026–T028. API sync (T026–T028) is optional scaffolding for future cross-session sync.

---

## Phase 6: User Story 4 — Dynamic Window Resize Handling (Priority: P4)

**Goal**: Recalculate the 4:3 canvas dimensions after a 200ms debounce on window resize; restart the evaluation cycle if canvas area grows.

**Independent Test**: Resize the browser window and confirm the canvas updates to the correct 4:3 size without a reload. Confirm it does not update on every intermediate resize event (debounced).

- [ ] T029 [US4] Replace existing `handleResize` in `frontend/src/components/IzaComputer.jsx` with a 200ms trailing-edge debounced handler: declare `let debounceTimer` inside the `useEffect` closure (not as a ref); `clearTimeout(debounceTimer)` on each `resize` event; call `_computeViewportMeasurements` + canvas resize only in the `setTimeout` callback after `RESIZE_DEBOUNCE_MS` (200ms); clean up timer in effect cleanup (depends on T013, T015)
- [ ] T030 [US4] Implement canvas area reference tracking in `frontend/src/components/IzaComputer.jsx`: add `lastEvalAreaRef` initialized to 0; after each viewport measurement update, compute `newArea = canvasWidth * canvasHeight`; if `newArea > lastEvalAreaRef.current`, restart the `EVAL_WINDOW_MS` evaluation window (reset `evalWindowStartTimeRef` and clear `frameTimesRef`) without resetting `qualityLevelRef`. Per FR-007: `lastEvalAreaRef.current` MUST be updated to the current canvas area **each time a new evaluation cycle begins** — this means (a) in this resize path when area increases, AND (b) inside T021's FR-005 routine cycle restart (every 3-second window reset must also set `lastEvalAreaRef.current = currentCanvasArea`). Without (b), routine cycle restarts would not update the reference area, causing the area-increase guard to incorrectly re-trigger on subsequent resize events that do not actually grow the canvas. (depends on T021, T029)

**Checkpoint**: Resize debounces correctly. Canvas recalculates to new 4:3 size within 500ms of debounce callback. Evaluation window restarts on area increase; quality level is preserved. US4 fully functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T031 [P] Update `appveyor.yml`: set Node.js version to 20 LTS; add `services: [postgresql]`; update build steps to workspace order `npm run build -w packages/types` → `npm run build -w api` → `npm run build -w frontend`; add `npm run typecheck` step before tests; preserve existing frontend S3 deploy step
- [ ] T032 [P] Add required comment blocks per constitution: (a) quality ladder evaluation loop in `frontend/src/components/IzaComputer.jsx` — document the 3s window, bidirectional step, stall threshold, and area re-evaluation logic; (b) stride loop and pass-skip logic in `frontend/src/utils/deformers.js` — document intent for block-fill, drop order rationale, and baseIdx pre-computation; (c) `QUALITY_LADDER` constant in `frontend/src/constants/magic-numbers.js` — add a header comment explaining the 8-step design, and inline each level entry with its drop rationale, approximate CPU cost %, and step-ordering decisions from data-model.md
- [ ] T033 Validate quickstart.md steps against implemented stack: run `npm install` from repo root, `npm run build -w packages/types`, `cp api/.env.example api/.env` + set DATABASE_URL, `npm run migrate -w api`, `npm run dev -w api` and `npm run dev -w frontend` — confirm all steps succeed without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **T006 and T012 BLOCK all user stories**; optional API/DB scaffold tasks (T005, T007–T011) do not block and may run in parallel with Phases 3–6
- **Phase 3 (US1)**: Requires T006 (magic-numbers.js) complete; no dependency on other user stories
- **Phase 4 (US2)**: Requires T006 complete; implementation is independent of US1 (deformer refactor is separate from canvas sizing) but US2 is most useful after US1 expands the canvas
- **Phase 5 (US3)**: Requires T006 complete; localStorage half (T023–T025) satisfies FR-008 independently; API half (T026–T028) is optional non-blocking scaffolding; T028 depends on T024 and T027
- **Phase 6 (US4)**: Requires US1 (T013, T015) and US2 (T021) to be complete
- **Phase 7 (Polish)**: Requires all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational only — fully independent of other stories
- **US2 (P2)**: Foundational only — deformer refactor is file-isolated; builds on US1 conceptually but T016–T019 are file-independent
- **US3 (P3)**: Foundational only for localStorage/API tasks; T025 (wire TARGET_FPS) depends on US2's T021
- **US4 (P4)**: Depends on US1 (T013, T015) and US2 (T021)

### Within Each User Story

- US2: T016–T018 [P] can run in parallel; T019 depends on T016–T018; T020–T021 are independent of T016–T019; T022 depends on T019, T020, T021
- US3: T023 and T024 are independent; T025 depends on T021 (US2) and T023; T026–T027 [OPTIONAL, P] can run in parallel; T028 [OPTIONAL] depends on T024 and T027

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel (different workspace directories)
- **Phase 2**: T007 and T008 can run in parallel (different files); T009 depends on T008 logically; T010 depends on T008; T011 depends on T010
- **Phase 4 (US2)**: T016, T017, T018 can all run in parallel (different functions in deformers.js)
- **Phase 5 (US3)**: T026 and T027 can run in parallel (same file but different route handlers — coordinate to avoid edit conflicts, or implement sequentially)
- **Phase 7**: T031 and T032 can run in parallel

---

## Parallel Example: US2 Deformer Refactor

```
# These three tasks touch different functions — run in parallel:
T016: Refactor _glowEdgesBit to accept params in frontend/src/utils/deformers.js
T017: Refactor _shiftPixel to accept params in frontend/src/utils/deformers.js
T018: Refactor _pixelizeBit to accept params in frontend/src/utils/deformers.js

# Then T019 depends on all three:
T019: Refactor applyAllDeformers with stride loop + QUALITY_LADDER lookup
```

## Parallel Example: Phase 2 Foundational

```
# These run in parallel (different files):
T005: packages/types/src/index.ts — shared types
T007: api/src/lib/response.ts — response helpers
T008: api/src/db/schema.ts — Drizzle schema

# Then sequentially:
T009 → T010 → T011 (migrations → db index → Express app)
T006: frontend/src/constants/magic-numbers.js (can run any time)
T012: frontend/vite.config.js (can run any time)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (monorepo scaffold)
2. Complete Phase 2: Foundational — CRITICAL, blocks all stories
3. Complete Phase 3: US1 (canvas sizing — T013–T015)
4. **STOP and VALIDATE**: Load app, verify 4:3 canvas fills window at multiple shapes
5. Demo / deploy if ready

### Incremental Delivery

1. Setup + Foundational → workspace installs, API starts, DB migrates
2. US1 → Canvas fills window → **First visible deliverable**
3. US2 → Quality adaptation runs → Display stays smooth at full size
4. US3 → Preset selector in settings → User control over FPS target
5. US4 → Resize debouncing → Polish for resize workflow
6. Polish → CI, comments, quickstart validation

### Single-Developer Order (Recommended)

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks within the same phase
- `[USn]` label maps the task to its user story for traceability
- No tests included — not requested in spec; add test tasks if TDD approach is adopted
- Each user story phase ends with a Checkpoint — validate the story independently before moving on
- Commit after each logical group (one story phase = one natural commit boundary)
- `QUALITY_LADDER` step parameter values in T006 are implementation estimates from data-model.md — adjust based on real device performance measurements during T019/T022 implementation

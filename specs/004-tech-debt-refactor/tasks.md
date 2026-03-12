# Tasks: Tech Debt Resolution & Codebase Refactor

**Input**: Design documents from `/specs/004-tech-debt-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/module-contracts.md ✅, quickstart.md ✅

**Tests**: Included — FR-024 through FR-028 explicitly require test coverage in the feature specification.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US6) — required for all user story phase tasks
- Exact file paths included in every task description

---

## Phase 1: Setup (TypeScript + Test Infrastructure)

**Purpose**: Install tooling scaffolding that all later work depends on. No user story work can begin until typecheck and test commands work.

- [x] T001 Create `frontend/tsconfig.json` with strict mode, allowJs, noEmit, jsx react-jsx per research.md §2
- [x] T002 Create `frontend/vitest.config.ts` with jsdom environment, globals, v8 coverage, setupFiles per research.md §3
- [x] T003 [P] Add devDependencies to `frontend/package.json`: typescript ^5, @types/react ^18, @types/react-dom ^18, vitest ^2, jsdom ^24, @testing-library/react ^15, @testing-library/jest-dom ^6
- [x] T004 Add `typecheck`, `test`, `test:watch`, `test:coverage` scripts to `frontend/package.json`
- [x] T005 Update root `package.json` scripts — replace Ember commands (build, start, test, lint:hbs) with workspace-scoped React/Vite equivalents per research.md §7; add workspace-scoped `typecheck` script
- [x] T006 Create `frontend/src/tests/setup.ts` importing `@testing-library/jest-dom` matchers

---

## Phase 2: Foundational (Type Definitions — Blocking Prerequisites)

**Purpose**: Create the canonical TypeScript types that all refactored modules depend on. No typed module can be implemented without these.

**⚠️ CRITICAL**: All user story work that touches types depends on this phase being complete.

- [x] T007 [P] Create `frontend/src/types/canvas.ts` with GlowParams, ShiftParams, PixelizeParams, DisplacementParams, QualityLevelConfig, QualityLadder, QualityLevel, QualityAdapterState, QualityAdapterConfig, FrameMetrics, QualityTransition per data-model.md §1
- [x] T008 [P] Create `frontend/src/types/terminal.ts` with AppEnvironment per data-model.md §2 (InputState and InputAction live in inputReducer.ts)
- [x] T009 [P] Create `frontend/src/types/game.ts` with GameState, StoryItem, RoomInventory, Room, RoomExit, ExitDirection, FlashlightState, FlashlightStatus per data-model.md §3
- [x] T010 [P] Add gallery route types GalleryImage, ShopImage, GalleryConfig to `frontend/src/routes/shared/galleryNavigator.ts` per data-model.md §5 (these are route-layer types — they do NOT belong in canvas.ts or terminal.ts)
- [x] T011 Verify `npm run typecheck -w frontend` passes with zero errors on all .ts files; confirm tsconfig resolves `packages/types` reference

**Checkpoint**: Type scaffolding complete — user story implementation can now begin

---

## Phase 3: User Story 1 — Establish Type Safety Across the Codebase (Priority: P1) 🎯 MVP

**Goal**: All frontend source files converted from .js/.jsx to .ts/.tsx; strict TypeScript with zero errors monorepo-wide; types from @presence/types used everywhere they apply.

**Independent Test**: `npm run typecheck --workspaces --if-present` reports zero errors. Any developer can open any frontend file and get autocomplete + inline type errors.

### Implementation for User Story 1

- [x] T012 [P] [US1] Rename all 5 `frontend/src/constants/*.js` → `.ts` (magic-numbers, command-registry, environment-values, story-items, story-rooms); add QualityLadder type to QUALITY_LADDER constant in `frontend/src/constants/magic-numbers.ts`
- [x] T013 [P] [US1] Rename `frontend/src/utils/rngeezus.js` → `frontend/src/utils/rngeezus.ts` with typed exports
- [x] T014 [P] [US1] Rename `frontend/src/utils/environment-helpers.js` → `frontend/src/utils/environment-helpers.ts` with typed exports
- [x] T015 [US1] Verify `frontend/src/utils/text-layout.js` (or .ts) exists in exactly one location; rename to `.ts` and add typed exports; update all import sites in `frontend/src/`
- [x] T016 [US1] Rename `frontend/src/hooks/usePersistence.js` → `frontend/src/utils/persistence.ts` with full typed exports per `contracts/module-contracts.md` §persistence (all localStorage functions, PersistenceKey type per data-model.md §4)
- [x] T017 [US1] Update all import sites of `usePersistence` → `persistence` throughout `frontend/src/` (hooks, game commands, storyCore)
- [x] T018 [P] [US1] Rename `frontend/src/components/LoadingIndicator.jsx`, `MpfIndicator.jsx`, `ScreenInput.jsx` → `.tsx`; add prop type annotations
- [x] T019 [US1] Rename `frontend/src/App.jsx` → `App.tsx`, `router.jsx` → `router.tsx`, `main.jsx` → `main.tsx`; add type annotations
- [x] T020 [US1] Rename all `frontend/src/routes/Cmd*.jsx` → `.tsx` (CmdCat, CmdLess, CmdViewer, CmdShop, and all remaining ×15 routes); add prop/context types
- [x] T021 [US1] Evaluate `frontend/src/context/StatusBarContext.tsx` — remove file if unused after all refactors; update any remaining references
- [x] T022 [US1] Fix all TypeScript strict mode errors surfaced by `tsc --noEmit` across `frontend/src/`; add inline comment for each `any`/`unknown` usage per FR-002a
- [x] T023 [US1] Disable `allowJs` in `frontend/tsconfig.json` (or verify no .js remain in `frontend/src/`); run strict typecheck to confirm SC-001

**Checkpoint**: All frontend source is TypeScript. `npm run typecheck --workspaces --if-present` — zero errors.

---

## Phase 4: User Story 2 — Eliminate Code Duplication (Priority: P2)

**Goal**: No two source files share more than trivial boilerplate. CmdCat/CmdLess share one implementation; CmdViewer/CmdShop share one gallery navigator; all ~20 route commands share one initialization pattern; text layout in one location.

**Independent Test**: A code-similarity scan shows no pair of source files with >10 lines of identical logic. Each shared utility has its own passing tests.

### Tests for User Story 2

- [x] T024 [P] [US2] Write unit tests for `showItemContent` utility in `frontend/src/tests/unit/routes/cmd-cat-less.test.tsx`
- [x] T025 [P] [US2] Write unit tests for `galleryNavigator` utility in `frontend/src/tests/unit/routes/cmd-gallery.test.tsx`

### Implementation for User Story 2

- [ ] T026 [US2] Create `frontend/src/routes/shared/showItemContent.ts` per `contracts/module-contracts.md` §showItemContent
- [ ] T027 [US2] Simplify `frontend/src/routes/CmdCat.tsx` and `frontend/src/routes/CmdLess.tsx` to delegate to `showItemContent`; remove duplicated logic
- [ ] T028 [US2] Create `frontend/src/routes/shared/galleryNavigator.ts` per `contracts/module-contracts.md` §galleryNavigator with ARROWLEFT/ARROWRIGHT handlers and wrapping index logic
- [ ] T029 [US2] Simplify `frontend/src/routes/CmdViewer.tsx` and `frontend/src/routes/CmdShop.tsx` to delegate to `galleryNavigator`; remove duplicated logic
- [ ] T030 [US2] Extract common route command initialization pattern (context retrieval, setAppEnvironment setup) into shared utility in `frontend/src/routes/shared/`
- [ ] T031 [US2] Apply shared init pattern to all `frontend/src/routes/Cmd*.tsx` files; remove per-file duplication
- [ ] T032 [US2] Verify SC-002 — confirm no two `frontend/src/` source files share >10 lines of identical logic

**Checkpoint**: Shared utilities extracted. CmdCat+CmdLess, CmdViewer+CmdShop, and all route init patterns consolidated.

---

## Phase 5: User Story 3 — Decompose Monolithic Files (Priority: P3)

**Goal**: IzaComputer, useInputProcessor, storyCore each decomposed into focused single-responsibility modules. Any described behavior is locatable within 2 minutes by reading the directory structure.

**Independent Test**: Each decomposed module can be imported and used independently; the full application behavior is unchanged after decomposition.

### Implementation for User Story 3

- [ ] T033 [P] [US3] Create `frontend/src/reducers/inputReducer.ts` with InputState, InputAction, initialInputState, and pure inputReducer function per `contracts/module-contracts.md` §inputReducer
- [ ] T034 [P] [US3] Create `frontend/src/utils/game/gameState.ts` with initGameState, reportGameState, handleCompletionEvent, getXp, getMaxXp, getIsNewGame, getIsGameCompleted per `contracts/module-contracts.md` §gameState
- [ ] T035 [P] [US3] Create `frontend/src/utils/game/inventoryManager.ts` with getItemById, getItemByName, getWeightOfUserInventory, canTakeItem, getRoomInventory, getItemIsLocked, useItem per `contracts/module-contracts.md` §inventoryManager
- [ ] T036 [P] [US3] Create `frontend/src/utils/game/roomNavigator.ts` with getCurrentRoom, getCurrentRoomId, getCurrentRoomDescription, getFullRoomDescription, getExitDescriptions, getIsExitUnlocked, isValidDirection, handlePositionChange, whereAmI, getIsRoomInSpace per `contracts/module-contracts.md` §roomNavigator
- [ ] T037 [P] [US3] Create `frontend/src/utils/game/flashlightManager.ts` with hasFlashlight, turnOffFlashlight, useFlashlight, getUserCanSeeInTheDark, getIsFlashlightWorking per `contracts/module-contracts.md` §flashlightManager
- [ ] T038 [US3] Update all `storyCore.js` consumers throughout `frontend/src/` to import from new game modules; delete `frontend/src/utils/storyCore.js` after zero remaining imports verified
- [ ] T039 [US3] Refactor `frontend/src/hooks/useInputProcessor.js` → `useInputProcessor.ts`: import inputReducer; replace stateRef direct mutation (lines 583–586) with argument-passing to `_execute()` per research.md §5; dispatch typed InputActions throughout
- [ ] T040 [US3] Write `inputReducer` unit tests covering SET_FIELDS, SET_CURSOR, PUSH_HISTORY, CLEAR, RESET actions in `frontend/src/tests/unit/inputReducer.test.ts`

**Checkpoint**: storyCore decomposed (4 modules), useInputProcessor refactored with typed reducer. Run full game session to verify game state integrity.

---

## Phase 6: User Story 4 — Modernize the Canvas Graphics Pipeline (Priority: P4)

**Goal**: Each deformer pass is a named, documented, independently testable function. Quality adapter has debounce. setTimeout repaint hack replaced. Visual output perceptually identical at all 8 quality levels.

**Independent Test**: Deformer tests pass with known pixel inputs. Quality adapter tests cover upgrade, downgrade, and oscillation prevention. Screenshots at all 8 quality levels are perceptually identical before and after.

### Tests for User Story 4

- [ ] T041 [P] [US4] Write deformer unit tests with known pixel input arrays for pixelizeBit, shiftPixel, glowEdgesBit in `frontend/src/tests/unit/deformers.test.ts` (FR-026) — write BEFORE refactoring deformers.js
- [ ] T042 [P] [US4] Write quality adapter transition tests (upgrade on high FPS, downgrade on low FPS, oscillation prevention with debounce) in `frontend/src/tests/unit/qualityAdapter.test.ts` (FR-025)

### Implementation for User Story 4

- [ ] T043 [US4] Refactor `frontend/src/utils/deformers.js` → `deformers.ts`: export pixelizeBit, shiftPixel, glowEdgesBit, applyAllDeformers individually with typed signatures and JSDoc per `contracts/module-contracts.md` §deformers; retain pixel loops (research.md §1)
- [ ] T044 [US4] Create `frontend/src/components/canvas/qualityAdapter.ts` with createQualityAdapter and evaluateQuality (pure, no side effects, includes debounce via lastTransitionMs) per `contracts/module-contracts.md` §qualityAdapter
- [ ] T045 [US4] Create `frontend/src/components/canvas/CanvasRenderer.ts` with initCanvases, renderFrame, triggerRepaint (double-rAF pattern replacing setTimeout z-index hack per FR-018) per `contracts/module-contracts.md` §CanvasRenderer; set imageSmoothingEnabled=false before every drawImage call
- [ ] T046 [US4] Refactor `frontend/src/components/IzaComputer.jsx` → `IzaComputer.tsx` as orchestrator-only component (~150 lines) that wires CanvasRenderer and qualityAdapter; add inline comment documenting dual-canvas data flow per FR-016
- [ ] T047 [US4] Canvas visual fidelity verification — capture screenshots at quality levels 0–7 before and after refactor using quickstart.md §Canvas procedure; document side-by-side comparison checklist in PR (SC-004, SC-005)

**Checkpoint**: Canvas pipeline decomposed. deformers.test.ts and qualityAdapter.test.ts pass. SC-010 verified (no setTimeout in rendering).

---

## Phase 7: User Story 5 — Remove Ember Artifacts (Priority: P5)

**Goal**: Zero Ember files in repository root. `npm start`, `npm test`, `npm run build` invoke React/Vite toolchain. New developer needs no migration documentation to run the project.

**Independent Test**: Running all documented commands from quickstart.md succeeds. `find . -maxdepth 1 -name "*ember*"` returns nothing.

### Implementation for User Story 5

- [ ] T048a [US5] **Before any deletion**: Read the Ember QUnit test file (located in the `/tests/` directory deleted by T048) and record its assertion logic — the exact behavior being tested, its inputs, and expected outcomes — as a comment block at the top of `frontend/src/tests/unit/ember-compat.test.ts` (create the file now with only the comment; implementation follows in T053a). This step MUST complete before T048 runs; without it T053a cannot faithfully port the test.
- [ ] T048 [US5] Delete Ember artifact files from repo root: `ember-cli-build.js`, `testem.js`, `.ember-cli`, `.template-lintrc.js` (if present); also delete the `/tests/` (QUnit) directory. **Depends on T048a** — assertion logic must be recorded first.
- [ ] T049 [P] [US5] Delete `/config/` (Ember environment directory) and `/vendor/` (Ember vendor directory) from repo root
- [ ] T050 [P] [US5] Move `MIGRATION_STATUS.md` and `EMBER_REACT_PATTERNS.md` to `docs/archive/` (FR-023); create `docs/archive/` if it does not exist
- [ ] T051 [US5] Remove all Ember devDependencies from root `package.json` (ember-cli, ember-data, ember-source, @ember/*, ember-template-lint, and any related packages)
- [ ] T052 [US5] Update `.eslintrc.js` — remove Ember plugin and template-lint rules; configure React-appropriate rules (FR-021)
- [ ] T053 [US5] Audit `appveyor.yml` for stale Ember commands or artifact paths; replace each with React/Vite equivalent per research.md §8 (FR-023a)
- [ ] T053a [US5] Port the Ember QUnit test assertion concept to Vitest (FR-022 second half): using the assertion logic recorded in `frontend/src/tests/unit/ember-compat.test.ts` by T048a, implement an equivalent test using the Vitest framework, confirming the same behavior is verified in the new test suite. **Depends on T048a** (assertion already recorded); **Depends on T048** (source file deleted, port from recorded notes only).
- [ ] T054 [US5] Verify: `npm install`, `npm run dev -w frontend`, `npm run build --workspaces --if-present` all succeed with zero errors; verify SC-006 (zero ember filenames in repo root) and SC-007

**Checkpoint**: Repository is clean React/Vite. All documented commands work. No Ember artifacts remain.

---

## Phase 8: User Story 6 — Establish Test Suite (Priority: P6)

**Goal**: Test suite with coverage of quality ladder, deformer pipeline, persistence, and ≥8 terminal route commands. Passes on every run. No Ember test infrastructure involved.

**Independent Test**: `npm test --workspaces --if-present` produces passing results for all critical areas; SC-008 criteria met.

### Implementation for User Story 6

- [ ] T055 [P] [US6] Write persistence module tests (save, load, missing key fallback, corrupt/invalid data recovery, read-compat smoke test confirming renamed module reads data written by old module name) in `frontend/src/tests/unit/persistence.test.ts` (FR-027)
- [ ] T056 [P] [US6] Write 6+ additional terminal route command tests to reach ≥8 total across `frontend/src/tests/unit/routes/cmd-*.test.tsx` (combined with T024 + T025 = FR-028); cover command initialization and output generation
- [ ] T057 [US6] Run complete test suite (`npm test --workspaces --if-present`); confirm all tests pass; verify SC-008 (quality transitions, deformer functions, persistence, ≥8 commands all covered)
- [ ] T058 [US6] Review `packages/types/src/index.ts` for gaps exposed by TS migration (missing type guards, incorrect shapes, untested serialization); add tests in `packages/types/` if gaps found (FR-024)
- [ ] T059 [US6] Verify monorepo test script wiring per quickstart.md — `npm test -w frontend`, `npm run test:watch -w frontend`, `npm run test:coverage -w frontend` all work correctly

**Checkpoint**: Full test suite passing. All FR-024 through FR-028 criteria met.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of all success criteria across all user stories.

- [ ] T060 [P] Verify SC-010 — grep for `setTimeout` in `frontend/src/components/`; confirm zero occurrences in rendering pipeline after CanvasRenderer refactor
- [ ] T061 [P] Verify SC-011 + SC-012 — start `npm run dev -w frontend`; open browser; navigate through commands and canvas rendering; confirm zero terminal warnings and zero browser console errors/warnings
- [ ] T061a [P] Verify FR-030 + SC-011 (API) — start `npm run dev -w api`; confirm zero deprecation warnings and startup errors in terminal output
- [ ] T062 [P] Run production build (`npm run build -w packages/types && npm run build -w api && npm run build -w frontend`); confirm zero errors and zero warnings (FR-032)
- [ ] T063 Verify SC-009 — confirm any behavior (quality adaptation, inventory management, gallery navigation) can be located within 2 minutes from directory structure alone; cross-check against quickstart.md §Key Directories
- [ ] T064 Run full quickstart.md end-to-end verification checklist: typecheck → test → build; all three pass with zero errors as required for PR merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story type annotations
- **US1 (Phase 3)**: Depends on Phase 2 (types) — foundational for all other stories
- **US2 (Phase 4)**: Depends on Phase 1 setup; benefits from US1 types but can begin after Phase 2
- **US3 (Phase 5)**: Depends on Phase 2 types; benefits from US1 (persistence.ts must be renamed first — T016/T017 in US1 block T034-T037 in US3)
- **US4 (Phase 6)**: Depends on Phase 2 types; benefits from US1 (deformers.ts needs canvas types)
- **US5 (Phase 7)**: Depends only on Phase 1 setup (root scripts already updated in T005); artifact deletion is independent
- **US6 (Phase 8)**: Depends on test infrastructure from Phase 1; test writing for each story should follow that story's implementation
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 1; independence from US1 (route files will be .jsx during US2, renamed to .tsx in US1 — coordinate or do US1 routes first)
- **US3 (P3)**: Depends on `persistence.ts` rename from US1 (T016/T017) before storyCore modules can import it
- **US4 (P4)**: Depends on canvas types from Phase 2; independent of US1/US2/US3
- **US5 (P5)**: Fully independent after Phase 1 (root scripts updated in T005)
- **US6 (P6)**: Test infrastructure in Phase 1; individual test files written alongside or after each story's implementation

### Within Each User Story

- Types before implementations (Phase 2 before US1)
- Shared modules before consumers (T026 before T027; T028 before T029; T033 before T039)
- New modules before deleting old ones (T034–T037 before T038)
- Tests for canvas pipeline written before refactoring (T041, T042 before T043–T046)

### Parallel Opportunities

- Phase 2: T007, T008, T009, T010 all parallel (different files)
- US1: T012, T013, T014 parallel (different directories); T018 parallel with T012–T014
- US3: T033, T034, T035, T036, T037 all parallel (different new files)
- US4: T041, T042 parallel; T043, T044, T045 parallel after tests
- US5: T048a MUST run first; T049 and T050 are parallel with each other (different files/dirs); T048 depends on T048a; T053a depends on T048a + T048
- US6: T055, T056 parallel

---

## Parallel Execution Examples

### Phase 2 — Parallel type file creation

```
Task: "Create frontend/src/types/canvas.ts" (T007)
Task: "Create frontend/src/types/terminal.ts" (T008)
Task: "Create frontend/src/types/game.ts" (T009)
```

### US3 — Parallel game module creation

```
Task: "Create frontend/src/utils/game/gameState.ts" (T034)
Task: "Create frontend/src/utils/game/inventoryManager.ts" (T035)
Task: "Create frontend/src/utils/game/roomNavigator.ts" (T036)
Task: "Create frontend/src/utils/game/flashlightManager.ts" (T037)
```

### US4 — Write tests before implementation

```
# First (parallel):
Task: "Write deformers.test.ts with known pixel inputs" (T041)
Task: "Write qualityAdapter.test.ts for transitions" (T042)

# Then (parallel after tests pass):
Task: "Refactor deformers.js → deformers.ts" (T043)
Task: "Create qualityAdapter.ts" (T044)
Task: "Create CanvasRenderer.ts" (T045)
```

---

## Implementation Strategy

### MVP (User Story 1 Only — TypeScript Safety)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational types (T007–T011)
3. Complete Phase 3: US1 TypeScript migration (T012–T023)
4. **STOP and VALIDATE**: `npm run typecheck --workspaces --if-present` → zero errors
5. All editors show inline type errors; autocomplete works on every file

### Incremental Delivery

1. Phase 1 + 2 → Infrastructure ready
2. US1 → TypeScript everywhere → validate → merge
3. US2 → Duplication eliminated → validate → merge
4. US3 → Monoliths decomposed → validate (full game session) → merge
5. US4 → Canvas modernized → validate (visual fidelity at 8 levels) → merge
6. US5 → Ember gone → validate (all docs commands work) → merge
7. US6 → Test suite complete → validate (SC-008) → merge
8. Polish → SC-001 through SC-012 all green → PR ready

---

## Notes

- `[P]` tasks = different files, no blocking dependencies — safe to parallelize
- `[USn]` label maps each task to its user story for traceability
- Persistence rename (US1: T016/T017) is a prerequisite for storyCore modules (US3: T034–T037) — do in order
- Canvas tests (US4: T041/T042) MUST be written before deformers.js is refactored to ensure pre/post parity
- Commit after each checkpoint to preserve rollback points
- Visual fidelity checklist (T047) is a manual step — allocate time before merging US4
- AppVeyor audit (T053) is critical — root script replacements in T005 must be consistent with appveyor.yml
- QUnit test port (US5: T048a MUST run before T048) — record the QUnit assertion logic before deleting the tests/ directory; T053a implements the port from T048a's recorded notes

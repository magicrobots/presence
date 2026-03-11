# Implementation Plan: Tech Debt Resolution & Codebase Refactor

**Branch**: `004-tech-debt-refactor` | **Date**: 2026-03-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-tech-debt-refactor/spec.md`

---

## Summary

Resolve accumulated technical debt from the Ember→React migration by: (1) completing the TypeScript migration of the frontend, (2) eliminating identified code duplication, (3) decomposing the four largest files into focused modules, (4) modernizing the canvas pipeline with documentation and structural improvements (pixel loops are retained — `ctx.filter` cannot achieve equivalent output for these proprietary CRT passes), and (5) removing all Ember artifacts. A Vitest suite is introduced alongside the refactors to provide a safety net. Architecture stays on React 18 + Vite 5 + Node/Express + PostgreSQL, deployed via AppVeyor → S3 with Route 53 DNS.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict) / Node.js 20 LTS
**Primary Dependencies**: React 18, Vite 5, @vitejs/plugin-react, react-router-dom 6, Vitest 2, jsdom, @testing-library/react
**Storage**: PostgreSQL (Drizzle ORM in API — out of scope for this feature) + localStorage (frontend persistence module)
**Testing**: Vitest 2 with jsdom environment; `tsc --noEmit` as CI typecheck gate
**Target Platform**: Browser (modern evergreen); CI on AppVeyor Node 20; deployment to AWS S3 / Route 53
**Project Type**: Web application (monorepo: frontend SPA + API + shared types)
**Performance Goals**: Canvas frame time equal or improved at each quality level; zero console errors/warnings
**Constraints**: All rendering on main thread (no OffscreenCanvas, no Workers); `ctx.filter` only where it achieves equivalent output (does not apply to existing deformer passes — see research.md §1)
**Scale/Scope**: ~38 frontend source files; 4 monolithic files totalling ~3,500 lines to decompose; 19 route components; 8 quality levels

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Rule | Status | Notes |
|---|---|---|
| React function components + hooks | ✅ Pass | All new code uses function components |
| TypeScript strict mode | ✅ Pass (this feature enables it) | Frontend currently JS — this feature completes the migration |
| No `any` without justification | ✅ Pass | FR-002a: `any` is strictly and unconditionally forbidden per constitution §4 — no exceptions of any kind. The only permitted fallback for un-typeable patterns is `unknown` + narrowing type guard, documented with an inline comment. No PR-level carve-outs for `any` exist. Constitution is authoritative. |
| Monorepo structure (frontend / api / packages) | ✅ Pass | No structural changes to workspace layout |
| State: React Context for global terminal state | ✅ Pass | `useInputProcessor` remains a hook; `useReducer` is the correct upgrade pattern |
| API: RESTful + JSON envelope | ✅ Pass | API is out of scope; no changes |
| No heavy external UI libs | ✅ Pass | No new component libraries introduced |
| Terminal keyboard shortcuts preserved | ✅ Pass | Keyboard handling refactored, not replaced |
| TS override (section 6) | ✅ Resolved | Section 6 allowed JS during initial migration phase. This feature closes that phase. |

**GATE RESULT: PASS.** No violations requiring justification.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-tech-debt-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 — GPU analysis, TS strategy, decomposition map
├── data-model.md        # Phase 1 — TypeScript interfaces and entity relationships
├── quickstart.md        # Phase 1 — Developer setup and workflow
├── contracts/
│   └── module-contracts.md   # Phase 1 — Public signatures for all new modules
└── tasks.md             # Phase 2 — /speckit.tasks output (not yet generated)
```

### Source Code (post-refactor layout)

```text
frontend/
├── tsconfig.json                        NEW — strict mode, noEmit, allowJs
├── vitest.config.ts                     NEW — jsdom env, globals, v8 coverage
├── vite.config.ts                       RENAMED from vite.config.js
├── src/
│   ├── types/
│   │   ├── canvas.ts                    NEW — QualityLevelConfig, DeformerPass types
│   │   ├── terminal.ts                  NEW — AppEnvironment, InputState, InputAction
│   │   └── game.ts                      NEW — Room, StoryItem, FlashlightState, etc.
│   ├── reducers/
│   │   └── inputReducer.ts              NEW — pure reducer extracted from useInputProcessor
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── CanvasRenderer.ts        NEW — dual-canvas setup, renderFrame, triggerRepaint
│   │   │   └── qualityAdapter.ts        NEW — evaluateQuality, debounce, emergency downgrade
│   │   ├── IzaComputer.tsx              REFACTORED — orchestrator only (~150 lines)
│   │   ├── LoadingIndicator.tsx         RENAMED .jsx → .tsx
│   │   ├── MpfIndicator.tsx             RENAMED .jsx → .tsx
│   │   └── ScreenInput.tsx              RENAMED .jsx → .tsx
│   ├── hooks/
│   │   └── useInputProcessor.ts         REFACTORED — useReducer + typed actions, stateRef fix
│   ├── utils/
│   │   ├── deformers.ts                 REFACTORED — passes exported individually + typed
│   │   ├── persistence.ts               RENAMED from hooks/usePersistence.js + typed
│   │   ├── environment-helpers.ts       RENAMED .js → .ts
│   │   ├── rngeezus.ts                  RENAMED .js → .ts
│   │   ├── text-layout.ts               CONFIRMED single location (line-wrapping util)
│   │   └── game/
│   │       ├── gameState.ts             NEW — from storyCore: state, XP, completion, deaths
│   │       ├── inventoryManager.ts      NEW — from storyCore: items, inventory, use
│   │       ├── roomNavigator.ts         NEW — from storyCore: rooms, exits, navigation
│   │       └── flashlightManager.ts     NEW — from storyCore: flashlight system
│   ├── constants/
│   │   ├── magic-numbers.ts             RENAMED .js → .ts
│   │   ├── command-registry.ts          RENAMED .js → .ts
│   │   ├── environment-values.ts        RENAMED .js → .ts
│   │   ├── story-items.ts               RENAMED .js → .ts
│   │   └── story-rooms.ts               RENAMED .js → .ts
│   ├── routes/
│   │   ├── shared/
│   │   │   ├── showItemContent.ts       NEW — shared by CmdCat + CmdLess
│   │   │   └── galleryNavigator.ts      NEW — shared by CmdViewer + CmdShop
│   │   ├── CmdCat.tsx                   SIMPLIFIED — uses showItemContent
│   │   ├── CmdLess.tsx                  SIMPLIFIED — uses showItemContent
│   │   ├── CmdViewer.tsx                SIMPLIFIED — uses galleryNavigator
│   │   ├── CmdShop.tsx                  SIMPLIFIED — uses galleryNavigator
│   │   └── Cmd*.tsx (×15)               RENAMED .jsx → .tsx + init pattern extracted
│   ├── context/
│   │   └── StatusBarContext.tsx         EVALUATE — remove if still unused after decomp
│   ├── App.tsx                          RENAMED .jsx → .tsx
│   ├── router.tsx                       RENAMED .jsx → .tsx
│   └── main.tsx                         RENAMED .jsx → .tsx
├── tests/
│   ├── unit/
│   │   ├── deformers.test.ts            NEW — FR-026: each pass with known pixel input
│   │   ├── qualityAdapter.test.ts       NEW — FR-025: upgrade/downgrade/oscillation
│   │   ├── persistence.test.ts          NEW — FR-027: save/load/missing/corrupt/compat
│   │   ├── inputReducer.test.ts         NEW — reducer action coverage
│   │   └── routes/
│   │       └── cmd-*.test.tsx           NEW — FR-028: ≥8 route command tests
│   └── setup.ts                         NEW — @testing-library/jest-dom setup

packages/types/
└── src/
    └── index.ts                         ADD tests if gaps found during TS migration

docs/
└── archive/
    ├── MIGRATION_STATUS.md              MOVED from root (FR-023)
    └── EMBER_REACT_PATTERNS.md          MOVED from root (FR-023)

# Root — Ember artifacts DELETED:
# ember-cli-build.js, testem.js, config/ (Ember env), vendor/, tests/ (QUnit)

# Root package.json scripts REPLACED:
# build: "ember build"   → "npm run build --workspaces --if-present"
# start: "ember serve"   → "npm run dev -w frontend"
# test:  "ember test"    → "npm test --workspaces --if-present"
# lint:hbs removed; all ember devDependencies removed

# appveyor.yml — already React/Vite; root script replacements above make it correct
```

**Structure Decision**: Monorepo Option 2 (frontend + api + packages). The `frontend/src/utils/game/` subdirectory groups the storyCore decomposition. The `frontend/src/components/canvas/` subdirectory groups the IzaComputer decomposition. Shared route utilities live in `frontend/src/routes/shared/`. No new workspaces are introduced.

---

## Complexity Tracking

> No constitution violations — table not required.

---

## Phase 0: Research Summary

All research is consolidated in [research.md](research.md). Key decisions:

1. **Canvas pixel loops stay** — `ctx.filter` cannot achieve equivalent output for any of the three deformer passes (see research.md §1). FR-015's "native API achieves equivalent output" clause does not trigger. Optimization focus shifts to: individual pass documentation, data-driven quality config, debounce, and replacing the setTimeout repaint hack.

2. **TypeScript migration** — `allowJs: true` + incremental file renames. Migration order: constants → utils → persistence → game modules → hooks → components → routes. See research.md §2 for full tsconfig.

3. **Vitest** — separate `vitest.config.ts`, jsdom environment. See research.md §3.

4. **storyCore → 4 modules** — gameState, inventoryManager, roomNavigator, flashlightManager. All depend on persistence directly. See research.md §4.

5. **stateRef fix** — pass `currentCommand` as argument to `_execute()` instead of mutating the ref. Cursor-loop `stateRef` pattern is acceptable and stays. See research.md §5.

6. **Ember artifacts** — Root `package.json` scripts are the main risk: `npm test` and `npm run build` currently invoke Ember. AppVeyor calls these scripts, so they must be replaced before CI can pass. See research.md §7.

---

## Phase 1: Design Artifacts

- **Data model**: [data-model.md](data-model.md) — TypeScript interfaces for all new types: canvas pipeline, input state, game entities, persistence keys, gallery config.

- **Module contracts**: [contracts/module-contracts.md](contracts/module-contracts.md) — Exported function signatures for every new or refactored module. These are the implementation targets.

- **Quickstart**: [quickstart.md](quickstart.md) — Dev setup, typecheck, test, build commands and post-refactor directory map.

---

## Implementation Sequence

The following order minimizes risk: each step is independently verifiable and leaves the app running.

### Stage 1 — Foundation (TypeScript + Test Infrastructure)
1. Add `tsconfig.json` to frontend (allowJs mode)
2. Add `vitest.config.ts` to frontend
3. Add `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` to frontend devDependencies
4. Add `typecheck` and `test` scripts to frontend/package.json
5. Update root package.json: replace Ember scripts, add workspace-scoped typecheck/test
6. Verify: `npm run typecheck -w frontend` passes (zero errors on .ts files; .js files not checked)

### Stage 2 — Ember Cleanup
7. Remove Ember artifact files (ember-cli-build.js, testem.js, config/, vendor/, tests/)
8. Archive MIGRATION_STATUS.md + EMBER_REACT_PATTERNS.md → docs/archive/
9. Remove Ember devDependencies from root package.json
10. Update .eslintrc.js — remove ember plugin, configure react rules
11. Verify: `npm install`, `npm run dev -w frontend` works; AppVeyor build script succeeds locally

### Stage 3 — Constants & Utilities (lowest-coupling files first)
12. Rename constants/*.js → .ts; add types (QUALITY_LADDER gets QualityLadder type)
13. Rename utils/rngeezus.js → .ts
14. Rename utils/environment-helpers.js → .ts
15. Create `frontend/src/types/canvas.ts`, `types/terminal.ts`, `types/game.ts`
16. Verify: typecheck passes

### Stage 4 — Canvas Pipeline Refactor
17. Create `frontend/src/reducers/inputReducer.ts` (extracted, pure reducer + typed actions)
18. Rename + refactor deformers.js → deformers.ts: export each pass individually with documented signatures; keep pixel loops
19. Create `components/canvas/qualityAdapter.ts` (extracted from IzaComputer + debounce logic per FR-017)
20. Create `components/canvas/CanvasRenderer.ts` (extracted from IzaComputer + triggerRepaint replacing setTimeout hack per FR-018)
21. Refactor IzaComputer.jsx → .tsx as orchestrator only
22. Rename remaining components: LoadingIndicator, MpfIndicator, ScreenInput → .tsx
23. Write deformer unit tests (tests/unit/deformers.test.ts) — FR-026
24. Write quality adapter tests (tests/unit/qualityAdapter.test.ts) — FR-025
25. **Visual fidelity check**: screenshot at all 8 quality levels; compare against pre-refactor

### Stage 5 — Persistence Rename
26. Rename hooks/usePersistence.js → utils/persistence.ts; add explicit typed exports
27. Update all import sites
28. Write persistence tests (tests/unit/persistence.test.ts) — FR-027 (save, load, missing, corrupt, compat smoke test)

### Stage 6 — storyCore Decomposition
29. Create utils/game/gameState.ts (state init, XP, completion, deaths)
30. Create utils/game/inventoryManager.ts (item lookups, inventory, use item)
31. Create utils/game/roomNavigator.ts (rooms, exits, navigation, descriptions)
32. Create utils/game/flashlightManager.ts (flashlight system)
33. Delete storyCore.js after all consumers updated
34. Verify: no imports of storyCore remain; app runs

### Stage 7 — useInputProcessor Refactor
35. Refactor useInputProcessor.js → .ts: import inputReducer; replace stateRef mutation with argument-passing pattern (research.md §5); typed actions throughout
36. Evaluate StatusBarContext — remove if unused
37. Write inputReducer tests (tests/unit/inputReducer.test.ts)

### Stage 8 — Route Deduplication
38. Create routes/shared/showItemContent.ts; simplify CmdCat.tsx + CmdLess.tsx
39. Create routes/shared/galleryNavigator.ts; simplify CmdViewer.tsx + CmdShop.tsx
40. Rename all remaining route .jsx → .tsx; extract common init pattern
41. Write route command tests (≥8 commands) — FR-028

### Stage 9 — Final Pass
42. Disable `allowJs` in tsconfig (or resolve remaining .js files); run strict typecheck — SC-001
43. Verify SC-002: no two source files share >10 lines of identical logic
44. Verify SC-006: zero ember filenames in repository root
45. Verify SC-010: no `setTimeout` in rendering pipeline
46. Verify SC-011 + SC-012: zero warnings in terminal output and browser console
47. Run full test suite; confirm all pass

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| storyCore decomposition breaks game state (death reset, completion events) | Medium | High | Write gameState + inventory tests before deleting storyCore; run full game session after each module |
| stateRef fix changes command execution timing | Low | Medium | Add integration test for handleScreenInput; verify history navigation works |
| Canvas visual regression after IzaComputer split | Low | High | SC-004 visual checklist at all 8 quality levels before and after Stage 4 |
| Ember script removal breaks AppVeyor CI | Low | Medium | Replace root scripts in Stage 2 before pushing; run build locally first |
| TypeScript strict mode reveals many `any` patterns in dynamic code | High | Low | `allowJs` mode during migration; fix incrementally; document each `any` with comment |

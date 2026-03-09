# Implementation Plan: Responsive Full-Window CRT Display

**Branch**: `003-responsive-crt-display` | **Date**: 2026-03-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-responsive-crt-display/spec.md`

---

## Summary

Scale the CRT canvas to fill the browser window (largest 4:3 rectangle, centered, solid black bars), replace the existing binary performance gate with a continuous 8-step adaptive quality ladder that incrementally dials 16 deformer knobs (stride, glow pass enable/random/threshold/falloff near+mid+far, shift pass enable/intensity/threshold, phosphor adjustment values large+small, displacement band count/speed), evaluated every 3 seconds bidirectionally. The user quality preset (High/Normal/Low) sets only the `TARGET_FPS` goal (60/30/15fps); the adapter moves up or down the step ladder to converge on that target on whatever device is present. Expose the preset selector in `cmd-settings` with cross-session persistence via `localStorage`. Concurrently, establish the full-stack monorepo scaffold (`frontend/` + `api/` + `packages/types/`) with a TypeScript Express API, Drizzle ORM + PostgreSQL, and the shared `ApiResponse<T>` / `UserPreferences` types — targeting quality preset sync as the first API consumer.

---

## Technical Context

**Language/Version**: JavaScript (frontend, existing JSX — no TS migration in this phase); TypeScript 5.x strict (api); TypeScript 5.x (packages/types)
**Primary Dependencies**: React 18, Vite 5, React Router v6 (frontend); Express.js, Drizzle ORM, pg (api); Node.js 20 LTS
**Storage**: PostgreSQL via Drizzle ORM (new, API-backed); `localStorage` via `usePersistence.js` (existing, source of truth for this feature's quality preset)
**Testing**: Vitest (frontend); Jest (api)
**Target Platform**: Modern browsers (last 3–4 years, CSS-resolution canvas); Node.js 20 LTS (api)
**Project Type**: Web application — React SPA frontend + REST API backend
**Performance Goals**: `TARGET_FPS` 30fps default (Normal preset); 15–60fps range; deformer pipeline scales 6%–100% CPU cost via quality ladder
**Constraints**: 200ms resize debounce; ≤500ms recalculation from debounce callback; 3s rolling evaluation window; emergency degradation on single-frame delta > 3000ms
**Scale/Scope**: Single-user web app; session identified by `username` from `usePersistence.getUsername()`

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Rule | Status | Notes |
|---|---|---|
| Monorepo: `frontend/` + `api/` + `types/` | PASS | This feature establishes the scaffold. Structure defined in Project Structure below. |
| TypeScript strict mode | PASS | `api/` and `packages/types/` use strict TS. Frontend stays JS per constitution §6 override for the responsive-crt-display phase. |
| API: RESTful + `ApiResponse<T>` envelope | PASS | Defined in `contracts/preferences-api.md`. Discriminated union in `@presence/types`. |
| State: React Context for global terminal state | PASS | No change to existing Context usage. Quality preset goes through `usePersistence` + rAF loop ref, not global Context (it's a hardware-level concern, not terminal state). |
| No heavy external UI libraries | PASS | No new UI libs introduced. |
| `any` forbidden | PASS | TS strict enforced in `api/`; `packages/types/` has no `any`. |
| Error handling: never crash on malformed input | PASS | Express routes validate inputs and return 400 before touching the DB. |
| Complex logic commented | PASS | Quality ladder and rAF evaluation loop require comment blocks; deformer stride loop requires intent documentation. |

**Constitution violations requiring justification:**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Frontend stays JavaScript (not TypeScript) | Constitution §6 explicitly overrides TS requirement for this phase | Full TS migration is a separate workstream; forcing TS on the frontend now would be out-of-scope scope creep and block this feature's delivery |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-responsive-crt-display/
├── plan.md              # This file
├── research.md          # Phase 0: optimization strategy, monorepo, ORM, CI decisions
├── data-model.md        # Phase 1: DB schema, shared types, quality ladder constants
├── quickstart.md        # Phase 1: local dev setup, run commands, migration workflow
├── contracts/
│   └── preferences-api.md   # Phase 1: GET/PUT /api/preferences contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root — target layout after this feature)

```text
presence/                            ← repo root (npm workspace root)
├── package.json                     ← private: true, workspaces: ["packages/*","frontend","api"]
├── appveyor.yml                     ← updated: Node 20, postgresql service, workspace build order
│
├── packages/
│   └── types/                       ← @presence/types — shared TypeScript interfaces
│       ├── package.json             ← name: "@presence/types"; emits .js + .d.ts
│       ├── tsconfig.json            ← target ES2020, declaration: true, strict: true
│       └── src/
│           └── index.ts             ← ApiResponse<T>, QualityPreset, UserPreferences
│
├── frontend/                        ← React 18 / Vite / JSX (current src/ moves here)
│   ├── package.json                 ← react, react-dom, react-router-dom; "@presence/types": "*"
│   ├── vite.config.js               ← adds server.proxy for /api → localhost:3001
│   └── src/
│       ├── components/
│       │   └── IzaComputer.jsx      ← PRIMARY CHANGE: canvas scaling, quality ladder, rAF loop
│       ├── utils/
│       │   └── deformers.js         ← PRIMARY CHANGE: stride + pass-skip, baseIdx pre-computation
│       ├── constants/
│       │   └── magic-numbers.js     ← PRIMARY CHANGE: TARGET_FPS, EVAL_WINDOW_MS, RESIZE_DEBOUNCE_MS, HEADROOM_FPS, QUALITY_LADDER
│       ├── hooks/
│       │   └── usePersistence.js    ← MINOR CHANGE: add getQualityPreset / setQualityPreset
│       └── routes/
│           └── CmdSettings.jsx      ← MINOR CHANGE: add 'qualitypreset' command to settings
│
└── api/                             ← Node.js / Express / TypeScript strict (new)
    ├── package.json                 ← express, drizzle-orm, pg; "@presence/types": "*"
    ├── tsconfig.json                ← strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes
    ├── .env.example
    └── src/
        ├── index.ts                 ← Express app, routes, error middleware
        ├── routes/
        │   └── preferences.ts       ← GET/PUT /api/preferences
        ├── db/
        │   ├── schema.ts            ← Drizzle table: user_preferences
        │   ├── index.ts             ← db = drizzle(pool, { schema })
        │   └── migrations/
        │       └── 0001_create_user_preferences.sql
        └── lib/
            └── response.ts          ← sendSuccess / sendError helpers
```

**Structure Decision**: Option 2 (Web application) — `frontend/` + `api/` monorepo per constitution. The existing `src/` directory contents move to `frontend/src/`. The Ember artifacts (`app/`, `ember-cli-build.js`, `testem.js`, legacy deps in `package.json`) are not removed by this feature but are irrelevant to the new workspace structure.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Frontend stays JS | Constitution §6 override | Migrating all existing JSX to TS is a separate workstream |
| Three-level quality ladder (not binary) | Binary on/off is the exact problem being fixed; the spec explicitly requires a multi-step integer ladder | Binary gate cannot gracefully degrade — it's the floor/ceiling of the old system |
| Monorepo scaffold (3 packages) | Constitution mandates; quality preset API is the first consumer | A single flat package cannot share TypeScript types between a JS Vite build and a TS Express API without path-aliasing hacks |

---

## Phase 0 Research Summary

All NEEDS CLARIFICATION items resolved. See [research.md](research.md) for full rationale.

| Question | Decision |
|---|---|
| Canvas optimization strategy | Stride-based pixel sampling + conditional pass skipping; `_glowEdgesBit` drops first (rngeezus hot path), then `_shiftPixel`, `_pixelizeBit` never drops |
| Quality level count | 8 steps (0–7): full quality at 0, minimum at 7; each step adjusts 14 deformer knobs — see data-model.md Step Ladder Definition |
| FPS measurement | `performance.now()` + rolling 3-second evaluation window; replaces `new Date()` + 30-frame one-shot |
| OffscreenCanvas / Worker | Not implemented — architecture cost too high for a decorative effect; reassess if stride+skip is insufficient |
| Monorepo tooling | npm workspaces (Node 20); no Turborepo/Nx — overkill for 3 packages |
| ORM | Drizzle ORM — no binary dep, no generate step, SQL migration files, ~7KB runtime; simpler Windows CI |
| Backend build | tsup (compile) + `tsc --noEmit` (typecheck); CJS output for Express compatibility |
| Backend hosting | AWS Elastic Beanstalk — low ops burden, VPC-native, suits long-running Express process |
| CI | Sequential steps in single Appveyor job; upgrade Node 8 → 20; `services: [postgresql]` built-in |
| Quality preset persistence | localStorage (immediate, this feature); PostgreSQL via API (scaffolded, future sync) |

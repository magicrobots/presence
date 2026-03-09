# Research: Responsive CRT Display + Full-Stack Scaffold

**Branch**: `003-responsive-crt-display` | **Date**: 2026-03-09

---

## Canvas Optimization Strategy

### Decision: Stride-based pixel sampling + conditional pass skipping

The primary bottleneck is `applyAllDeformers` in `src/utils/deformers.js`, which chains three pixel passes
(`_pixelizeBit`, `_shiftPixel`, `_glowEdgesBit`) on every pixel, every frame, via
`getImageData` / `putImageData`. At a 1200×900 canvas (~1,080,000 pixels), this is the dominant
cost. At full-window sizes (e.g., 1920×1080 = ~2,073,600 pixels), it roughly doubles.

The three passes are drop-ordered as follows — most expendable first:

| Pass | Cost driver | Drop order |
|---|---|---|
| `_glowEdgesBit` | `rngeezus.getRandomValue()` call per qualifying pixel + contrast branch | First |
| `_shiftPixel` | `i * positionFactor` (i×20) out-of-bounds writes, brightness sum | Second |
| `_pixelizeBit` | Phosphor sub-pixel RGB triad — core CRT identity | Never |

**Quality level ladder** — 8 steps (0 = max quality, 7 = min quality), each adjusting multiple knobs across the real deformer parameters. The user's quality preset sets only `TARGET_FPS`; the adapter moves up or down the ladder to hit it.

The full 14-knob set and the step-by-step table are defined in [data-model.md](data-model.md#step-ladder-definition). Key progression:
- Steps 0→1: drop `rngeezus.getRandomValue()` from the glow hot path (biggest single saving)
- Steps 1→3: raise glow contrast threshold (fewer edges trigger), reduce effect intensities
- Step 4: disable glow entirely; shift stays active
- Steps 5→6: reduce intensities further, apply stride-2 pixel sampling
- Steps 6→7: stride-4, disable shift, zero displacement bands

Block-fill copies sampled pixels into skipped neighbors to avoid visible banding at stride > 1.

### Rationale

- `_pixelizeBit` is the defining visual signature — the phosphor RGB triad. It must always run.
- `_glowEdgesBit` calls `rngeezus.getRandomValue('largeDisplacementPool')` inside the hot loop. This is the single most expensive per-pixel operation and the correct first drop.
- Stride-based sampling degrades gracefully: at stride-2 the phosphor triads visually smear slightly; at stride-4 the effect becomes softer but the display remains recognizably CRT-styled.
- No external libraries or WebGL are introduced, preserving the constraint.

### Alternatives Considered

| Option | Rejected Reason |
|---|---|
| WebGL shader | Requires introducing a WebGL context alongside two existing 2D canvases; scope violation |
| OffscreenCanvas + Worker | `getImageData` must originate from main-thread canvas after compositing; `rngeezus` is a stateful singleton; Worker round-trip adds a frame of lag |
| Dirty-region processing | `_shiftPixel` writes to `i * 20` offset and `_glowEdgesBit` writes to `i+1..3` — cross-region writes make dirty-rect tracking unreliable |
| Row-level stride | Horizontal banding more visually disruptive than block-fill column artifacts |

### Additional micro-optimizations

- **`performance.now()` over `new Date().getTime()`**: sub-millisecond precision, lower overhead. Current code at `IzaComputer.jsx:451` uses `Date`.
- **Pre-compute base index**: `const baseIdx = i * 4` once per outer loop iteration, eliminating redundant multiplication inside each pass function (~6.5M multiplications/frame at 1080p).
- **Hoist `rngeezus.getRandomValue`**: pre-compute once per frame outside the pixel loop (currently called inside `_glowEdgesBit` per qualifying pixel).

---

## FPS Measurement and Adaptive Quality Loop

### Decision: Rolling 3-second evaluation window, bidirectional 8-step quality ladder

Replace the current 30-frame one-shot gate (`PERFORMANCE_TEST_LENGTH: 30`, binary `isPerformantRef`) with:

- **Rolling window**: drop frame-time samples older than 3000ms from the front of the evaluation array. Triggers evaluation after 3 seconds OR 180 samples, whichever comes first.
- **Bidirectional**: if measured FPS < `TARGET_FPS`, step quality down; if measured FPS > `TARGET_FPS` + headroom (5fps), step quality up. The loop runs for the session lifetime.
- **Emergency degradation**: if any single rAF delta > 3000ms, immediately drop to LOW and restart the evaluation window.
- **Canvas area re-evaluation**: seed area reference at 0; any real canvas area exceeds 0, so the first evaluation always runs. On canvas area increase, restart the evaluation window (do not reset quality level).

### `TARGET_FPS` constants (replaces `MAX_MPF: 150`, `PERFORMANCE_TEST_LENGTH: 30`)

```js
TARGET_FPS: 30,          // Normal preset default
TARGET_FPS_HIGH: 60,     // High preset
TARGET_FPS_LOW: 15,      // Low preset
EVAL_WINDOW_MS: 3000,    // Rolling evaluation window length
STALL_THRESHOLD_MS: 3000 // Emergency degradation trigger
```

---

## Resize Handling

### Decision: 200ms trailing-edge debounce on the `resize` event listener

The current `handleResize` fires on every intermediate resize event, triggering two React `setState` calls (two re-renders) and a `_doRedrawHackRef` 740ms timeout per event. During a resize drag at 60Hz, this is 60+ re-renders per second.

200ms trailing-edge: the display reflows only after resize activity stops, not on each intermediate position. `debounceTimer` declared inside the effect closure (not as a ref) so it does not persist across React StrictMode double-invocations.

---

## Monorepo Structure

### Decision: npm workspaces — `frontend/` + `api/` + `packages/types/`

```
presence/
├── package.json                 ← workspace root (private: true)
├── packages/
│   └── types/
│       ├── package.json         ← name: "@presence/types"
│       ├── tsconfig.json
│       └── src/index.ts         ← ApiResponse<T>, QualityPreset, UserPreferences
├── frontend/                    ← React 18 / Vite / JSX (from current src/)
│   ├── package.json
│   └── src/
└── api/                         ← Node.js / Express / TypeScript strict
    ├── package.json
    ├── tsconfig.json
    └── src/
```

Root `package.json` `"workspaces": ["packages/*", "frontend", "api"]`.

### Rationale

- npm workspaces require no extra tooling (Turborepo, Nx, Lerna) and are available on Appveyor with Node 20 LTS.
- The workspace protocol allows `frontend` and `api` to declare `"@presence/types": "*"` — npm symlinks the local package.
- Frontend stays JavaScript (no TS migration per user instruction). VS Code reads `packages/types/dist/index.d.ts` to provide IDE autocomplete in `.jsx` files via JSDoc `@type` annotations.

### Alternatives Considered

| Option | Rejected |
|---|---|
| pnpm workspaces | Requires pnpm on Appveyor agents |
| Yarn workspaces | Repo has both `package-lock.json` and `yarn.lock` (Ember era); npm is cleaner going forward |
| Turborepo / Nx | Adds complexity for a 3-package monorepo |
| Separate repos | Breaks atomic cross-cutting PRs; type drift |

---

## ORM: Drizzle ORM (over Prisma)

### Decision: Drizzle ORM with `pg` driver

**Key reasons:**
1. No binary dependency — Prisma ships a platform-specific Rust query engine. On Windows Appveyor agents, `postinstall` binary detection is fragile.
2. No code generation step — Drizzle schemas are `.ts` files. No `prisma generate` before `tsc`. Simpler Appveyor pipeline.
3. SQL migrations are plain `.sql` files reviewable in PRs.
4. Drizzle runtime is ~7 KB; Prisma client is several MB.

### Rejected: Prisma

Better documentation and Prisma Studio GUI, but the binary dependency and generate step add Windows CI friction.

---

## Backend Build: tsup + tsc --noEmit

### Decision: `tsup` for compilation, `tsc --noEmit` for type checking

```json
{
  "typecheck": "tsc --noEmit",
  "build":     "tsup src/index.ts --format cjs --out-dir dist --sourcemap",
  "dev":       "tsup src/index.ts --format cjs --watch"
}
```

`tsconfig.json` key settings: `"module": "CommonJS"`, `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.

CJS chosen over ESM: Express and most middleware expect CJS; ESM in Node adds friction with `__dirname`, dynamic requires, and some `pg`/Drizzle edge cases.

---

## API Response Shape

### Decision: `ApiResponse<T>` discriminated union in `@presence/types`

```ts
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

The `success: boolean` discriminant enables exhaustive narrowing in TypeScript (backend) and IDE inference via `.d.ts` in JavaScript (frontend). Backend sends via `sendSuccess(res, data)` / `sendError(res, message, status)` helpers in `api/src/lib/response.ts`.

---

## CI/CD: Appveyor Extension

### Decision: Sequential steps in single Appveyor job; Node 20 LTS; built-in PostgreSQL service

The current `appveyor.yml` uses Node 8 and yarn. Upgrade path:
- Node 20 LTS required for npm workspaces (npm 7+), TypeScript 5.x, Drizzle 0.30+.
- `services: [postgresql]` starts built-in PostgreSQL (credentials: `postgres` / `Password12!` on localhost:5432).
- Matrix builds rejected: two independent agents cannot share the DB service for integration tests.

**Deploy ordering** (explicit migration before deploy):
1. `cd api && DATABASE_URL=%PROD_DATABASE_URL% npm run migrate`
2. Upload `api/dist/` zip to S3 staging bucket
3. Create EB application version + trigger `update-environment`
4. `aws s3 sync frontend/dist/ s3://presence-frontend/ --delete`
5. `aws cloudfront create-invalidation --paths "/*"`

---

## Backend Hosting: AWS Elastic Beanstalk

### Decision: Elastic Beanstalk for API; S3 + CloudFront unchanged for frontend

EB chosen over:
- **EC2**: requires manual OS patching, nginx config, systemd unit files, TLS management.
- **ECS Fargate**: valid future path but requires Dockerfile + ECR + task definitions + ALB — more moving parts than needed now.
- **Lambda**: Express is long-running; Lambda cold starts hurt API latency; Lambda creates many short-lived DB connections exhausting `max_connections` without RDS Proxy.

EB instance: `t3.micro` for dev/staging, `t3.small` for production. VPC-native, Express reaches RDS via private subnet.

---

## Database: AWS RDS PostgreSQL

Private subnets only; Security Group restricts port 5432 to the EB security group; automated backups (7-day retention); Multi-AZ for production. Credentials via AWS Secrets Manager.

Migrations run as an **explicit deploy step** (not at app startup) to avoid connection-pool racing on multi-instance EB rollout. Expand-contract pattern required for destructive schema changes.

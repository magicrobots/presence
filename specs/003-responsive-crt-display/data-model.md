# Data Model: Responsive CRT Display + Full-Stack Scaffold

**Branch**: `003-responsive-crt-display` | **Date**: 2026-03-09

---

## Overview

This feature is primarily a frontend canvas optimization. The only persistent application data it introduces is the **quality preset** (FR-008), which must persist across sessions. In the near term, this is stored in `localStorage` via the existing `usePersistence.js` pattern. The new API/DB layer scaffolded in this feature provides the target for future sync — the schema and API contract are defined now so the migration path is clear.

No existing localStorage data is migrated to the DB as part of this feature.

---

## Entities

### `user_preferences`

Stores application-level user settings, keyed by a session identifier (the existing `username` value from `usePersistence.getUsername()`). Quality preset is the first preference managed here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | Auto-increment surrogate key |
| `username` | `varchar(255)` | NOT NULL, UNIQUE | From `usePersistence.getUsername()`; defaults to `'guest'` |
| `quality_preset` | `varchar(10)` | NOT NULL, DEFAULT `'normal'` | Enum-constrained: `'high'`, `'normal'`, `'low'` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last update; maintained by app logic or trigger |

**Valid `quality_preset` values:**

| Value | `TARGET_FPS` | Meaning |
|---|---|---|
| `'high'` | 60 | High fidelity; adapter runs at high quality when device can sustain 60fps |
| `'normal'` | 30 | Default; balanced for most devices |
| `'low'` | 15 | Battery/thermal conscious; keeps quality low to preserve resources |

**Validation rules:**
- `quality_preset` MUST be one of `['high', 'normal', 'low']`; any other value is rejected with HTTP 400.
- `username` is trimmed and lowercased before storage.
- On first `PUT /api/preferences`, the row is upserted (insert or update on conflict).

---

## Drizzle Schema

```ts
// api/src/db/schema.ts
import { pgTable, serial, varchar, timestamptz } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id:            serial('id').primaryKey(),
  username:      varchar('username', { length: 255 }).notNull().unique(),
  qualityPreset: varchar('quality_preset', { length: 10 }).notNull().default('normal'),
  createdAt:     timestamptz('created_at').notNull().defaultNow(),
  updatedAt:     timestamptz('updated_at').notNull().defaultNow(),
});
```

---

## Shared Types (`packages/types/src/index.ts`)

```ts
// API response envelope
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError     = { success: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Quality preset enum
export type QualityPreset = 'high' | 'normal' | 'low';

// UserPreferences payload (used in GET and PUT responses)
export interface UserPreferences {
  username:      string;
  qualityPreset: QualityPreset;
}

// PUT /api/preferences request body
export interface UpdatePreferencesRequest {
  qualityPreset: QualityPreset;
}
```

---

## State Transitions

### Quality Preset Lifecycle

```
First launch
    │
    ▼
localStorage 'magic-robots-data'.quality-preset = 'normal'  (immediate, FR-008)
    │
    │  (future: on login / session start)
    ▼
GET /api/preferences → merge with localStorage (API wins on conflict)
    │
    │  (user selects preset in cmd-settings)
    ▼
localStorage updated immediately (applies to current session)
PUT /api/preferences (best-effort background sync)
```

---

## Frontend Constants (magic-numbers.js additions)

These are not DB entities but are the primary numeric contracts this feature introduces:

| Constant | Value | Purpose |
|---|---|---|
| `TARGET_FPS` | 30 | Active FPS target; set by quality preset selection |
| `TARGET_FPS_HIGH` | 60 | High preset bound |
| `TARGET_FPS_LOW` | 15 | Low preset bound |
| `EVAL_WINDOW_MS` | 3000 | Rolling FPS evaluation window duration |
| `STALL_THRESHOLD_MS` | 3000 | Emergency degradation trigger (single-frame delta) |
| `RESIZE_DEBOUNCE_MS` | 200 | Trailing-edge resize debounce delay |
| `CANVAS_ASPECT_RATIO` | 4/3 | Fixed canvas aspect ratio |

---

## Quality Level Ladder (Frontend, not DB)

The quality level is an integer counter (0 = maximum quality, 7 = minimum quality). The adapter steps it up or down by 1 each evaluation cycle. Emergency degradation jumps directly to level 7 and restarts the window.

**This is independent of the user quality preset.** The preset only sets `TARGET_FPS`. The adapter adjusts the level to hit that FPS target on whatever device is present. On a powerful device with Normal preset (30fps), the adapter may settle at level 0. On a slow device with the same preset, it may settle at level 5.

### Tunable Knobs (sourced from actual deformer code)

All of these are currently hardcoded constants in `deformers.js` and `IzaComputer.jsx`. After this feature they become parameters passed into `applyAllDeformers(imageData, params)` and `_deform(ctx2, params)`:

| Knob | Source | Current Value |
|---|---|---|
| `stride` | outer loop, `applyAllDeformers` | 1 (every pixel) |
| `glow.enabled` | `_glowEdgesBit` runs at all | true |
| `glow.useRandom` | `rngeezus.getRandomValue()` in hot path | true |
| `glow.maxContrast` | brightness delta threshold | 120 |
| `glow.distance` | look-ahead pixel distance | 3 |
| `glow.falloff.near` | glow multiplier for pixel i+1 | 1.0 (×increaseAmount) |
| `glow.falloff.mid` | glow multiplier for pixel i+2 | 0.5 |
| `glow.falloff.far` | glow multiplier for pixel i+3 | 0.2 |
| `shift.enabled` | `_shiftPixel` runs at all | true |
| `shift.positionFactor` | chromatic displacement distance in pixels | 5 |
| `shift.factor` | divisor for shift intensity | 7 |
| `shift.brightnessThreshold` | min r+g+b to trigger shift | 140 |
| `pixelize.adjustmentLarge` | R/B channel delta for phosphor triads | 24 |
| `pixelize.adjustmentSmall` | brightness enhance on every 4th pixel | 12 |
| `displacement.bandCount` | number of scanline bands (0–3) | 3 |
| `displacement.travelPixelsPerCycle` | band scroll speed per frame | 3 |

### Step Ladder Definition

| Level | stride | glow.en | glow.rand | maxContrast | shift.en | adj.Large | adj.Small | bands | Approx cost |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | ✓ | ✓ | 120 | ✓ | 24 | 12 | 3 | 100% |
| 1 | 1 | ✓ | — | 120 | ✓ | 24 | 12 | 3 | ~70% |
| 2 | 1 | ✓ | — | 150 | ✓ | 22 | 12 | 2 | ~55% |
| 3 | 2 | ✓ | — | 180 | ✓ | 20 | 10 | 2 | ~35% |
| 4 | 2 | — | — | — | ✓ | 18 | 10 | 1 | ~22% |
| 5 | 2 | — | — | — | ✓ | 14 | 8 | 1 | ~18% |
| 6 | 4 | — | — | — | — | 12 | 6 | 0 | ~8% |
| 7 | 4 | — | — | — | — | 8 | 4 | 0 | ~5% |

**Notes on step design:**
- Level 1 drops `glow.useRandom` first — this is the single most expensive per-pixel operation (rngeezus pool lookup inside a branch in the hot loop).
- Levels 2–3 raise `maxContrast` (fewer edges trigger glow) and reduce `adjustmentLarge` before disabling glow entirely. This preserves some phosphor halation character while reducing cost.
- Level 4 fully disables `glow`. `shift` stays active through level 5 — it's cheap relative to glow.
- Levels 6–7 apply stride-4 (every fourth pixel, block-fill neighbors). At stride-4 the phosphor triad pattern (`i % 4`) averages out visually; `adjustmentLarge`/`adjustmentSmall` are reduced to compensate.
- `displacement.bandCount` reaches 0 at level 6 — the scanline-band effect is dropped last among the visual elements because it contributes strongly to the CRT aesthetic, but at 0 bands the `_createDisplacement` calls are skipped entirely (zero cost).
- The exact cost percentages are estimates; actual values should be measured during implementation on a reference device and the thresholds tuned accordingly. **The step ladder values are implementation decisions, not contractual — the implementer should adjust parameter values based on real performance measurements.**

---

## Migration File

```sql
-- api/src/db/migrations/0001_create_user_preferences.sql
CREATE TABLE IF NOT EXISTS user_preferences (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(255) NOT NULL UNIQUE,
    quality_preset VARCHAR(10)  NOT NULL DEFAULT 'normal'
                   CHECK (quality_preset IN ('high', 'normal', 'low')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_username
    ON user_preferences (username);
```

# API Contract: User Preferences

**Service**: `api/` (Node.js + Express + TypeScript)
**Base URL**: `/api`
**Auth**: None (session identified by `username` in request body/query)
**Content-Type**: `application/json`

---

## Response Envelope

All responses use the `ApiResponse<T>` discriminated union from `@presence/types`:

```ts
// Success
{ "success": true, "data": <T> }

// Error
{ "success": false, "error": "<message>", "code": "<machine-readable>" }
```

---

## Endpoints

### `GET /api/preferences`

Retrieve preferences for a user.

**Query Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `username` | `string` | Yes | User identifier (from `usePersistence.getUsername()`) |

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "username": "alice",
    "qualityPreset": "normal"
  }
}
```

**Error Responses**

| Status | `code` | Condition |
|---|---|---|
| 400 | `MISSING_USERNAME` | `username` query param absent or blank |
| 404 | `NOT_FOUND` | No preferences row exists for this username |
| 500 | `INTERNAL_ERROR` | DB error |

---

### `PUT /api/preferences`

Create or update preferences for a user (upsert on `username`).

**Request Body**

```json
{
  "username": "alice",
  "qualityPreset": "high"
}
```

| Field | Type | Required | Valid Values |
|---|---|---|---|
| `username` | `string` | Yes | Any non-empty string (trimmed, lowercased) |
| `qualityPreset` | `string` | Yes | `"high"`, `"normal"`, `"low"` |

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "username": "alice",
    "qualityPreset": "high"
  }
}
```

**Error Responses**

| Status | `code` | Condition |
|---|---|---|
| 400 | `MISSING_USERNAME` | `username` absent or blank |
| 400 | `INVALID_PRESET` | `qualityPreset` not one of the three valid values |
| 500 | `INTERNAL_ERROR` | DB error |

---

## TypeScript Types (from `@presence/types`)

```ts
export type QualityPreset = 'high' | 'normal' | 'low';

export interface UserPreferences {
  username:      string;
  qualityPreset: QualityPreset;
}

export interface UpdatePreferencesRequest {
  qualityPreset: QualityPreset;
}

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError      = { success: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

---

## Frontend Usage Pattern (JavaScript)

```js
// GET on session start
const res = await fetch(`/api/preferences?username=${persistence.getUsername()}`)
  .then(r => r.json());
if (res.success) {
  applyQualityPreset(res.data.qualityPreset);
} else if (res.code !== 'NOT_FOUND') {
  console.warn('Preferences fetch failed:', res.error);
  // fall back to localStorage value — no UI error shown
}

// PUT when user selects a preset
async function savePreset(preset) {
  persistence.setGraphicsMode(preset);       // localStorage first (immediate)
  await fetch('/api/preferences', {          // best-effort DB sync
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: persistence.getUsername(),
      qualityPreset: preset
    })
  }).catch(() => { /* non-critical — localStorage is source of truth */ });
}
```

---

## Backend Route Implementation Sketch

```ts
// api/src/routes/preferences.ts
import { Router } from 'express';
import { db } from '../db';
import { userPreferences } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import { eq } from 'drizzle-orm';
import type { UpdatePreferencesRequest, QualityPreset } from '@presence/types';

const VALID_PRESETS: QualityPreset[] = ['high', 'normal', 'low'];

export const preferencesRouter = Router();

preferencesRouter.get('/', async (req, res) => {
  const username = String(req.query['username'] ?? '').trim().toLowerCase();
  if (!username) return sendError(res, 'username is required', 400, 'MISSING_USERNAME');

  const rows = await db.select().from(userPreferences).where(eq(userPreferences.username, username));
  if (rows.length === 0) return sendError(res, 'Not found', 404, 'NOT_FOUND');

  const row = rows[0];
  return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset });
});

preferencesRouter.put('/', async (req, res) => {
  const body = req.body as Partial<UpdatePreferencesRequest & { username: string }>;
  const username = String(body.username ?? '').trim().toLowerCase();
  if (!username) return sendError(res, 'username is required', 400, 'MISSING_USERNAME');

  const preset = body.qualityPreset;
  if (!preset || !VALID_PRESETS.includes(preset))
    return sendError(res, `qualityPreset must be one of: ${VALID_PRESETS.join(', ')}`, 400, 'INVALID_PRESET');

  const [row] = await db
    .insert(userPreferences)
    .values({ username, qualityPreset: preset })
    .onConflictDoUpdate({ target: userPreferences.username, set: { qualityPreset: preset, updatedAt: new Date() } })
    .returning();

  return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset });
});
```

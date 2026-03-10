# Quickstart: Responsive CRT Display + Full-Stack Scaffold

**Branch**: `003-responsive-crt-display`

This guide covers running the full monorepo stack locally after this feature is implemented.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | Required for npm workspaces, Drizzle, TypeScript 5.x |
| npm | 7+ | Ships with Node 20 |
| PostgreSQL | 14+ | Local install or Docker |
| Git | Any | — |

> If you only need to work on the **frontend** (CRT display / canvas optimization), skip to [Frontend Only](#frontend-only).

---

## First-Time Setup

```bash
# 1. Clone and install all workspaces from repo root
git clone <repo-url> presence
cd presence
npm install       # installs frontend, api, and packages/types dependencies

# 2. Build the shared types package (required before api and frontend can import from @presence/types)
npm run build -w packages/types

# 3. Set up environment variables
cp api/.env.example api/.env
# Edit api/.env and set DATABASE_URL to your local Postgres instance:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/presence_dev

# 4. Create the local database and run migrations
createdb presence_dev   # or use psql: CREATE DATABASE presence_dev;
npm run migrate -w api

# 5. Done — see run commands below
```

---

## Running Locally

### Full Stack (frontend + api)

```bash
# Terminal 1: start the API (TypeScript, watch mode)
npm run dev -w api
# → http://localhost:3001

# Terminal 2: start the frontend (Vite, HMR)
npm run dev -w frontend
# → http://localhost:5173
```

The frontend proxies `/api/*` requests to `http://localhost:3001` (configured in `frontend/vite.config.js`).

### Frontend Only

The frontend runs without the API. Quality preset falls back to localStorage entirely.

```bash
npm run dev -w frontend
# → http://localhost:5173
```

---

## Available Scripts (from repo root)

| Command | Description |
|---|---|
| `npm run build` | Build all workspaces in order: types → api → frontend |
| `npm run dev -w frontend` | Start Vite dev server with HMR |
| `npm run dev -w api` | Start Express API in watch mode (tsup --watch) |
| `npm run typecheck` | Run `tsc --noEmit` on api and packages/types |
| `npm test --workspaces` | Run all tests |
| `npm run migrate -w api` | Apply pending Drizzle migrations |
| `npm run migrate:generate -w api` | Generate a new migration from schema changes |

---

## Environment Variables

### `api/.env` (never committed)

```env
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/presence_dev
NODE_ENV=development
PORT=3001

# Optional
LOG_LEVEL=debug
```

### `frontend/.env` (never committed)

```env
# API base URL — Vite proxy handles this in dev; set for production builds
VITE_API_BASE_URL=http://localhost:3001
```

---

## Frontend Only: What Changed (CRT Display Feature)

After this feature, the CRT display:

1. **Fills the browser window** — no more 1200px cap. The canvas scales to the largest 4:3 rectangle that fits, centered with black bars.
2. **Adapts quality automatically** — the rAF loop measures FPS every 3 seconds and steps quality up or down (HIGH → MED → LOW) to stay near `TARGET_FPS` (default: 30fps).
3. **User-selectable preset** — type `settings` in the terminal, then `graphicsmode` to see the quality preset options: `high`, `normal`, `low`.

To verify the feature is working:
- Open browser DevTools → Performance tab
- Run a profiling trace while the CRT display is visible
- Frame time should stabilize near 33ms (30fps Normal preset) within ~3 seconds
- Resize the browser window — the canvas should recalculate within 700ms of the resize stopping

---

## API: Local Testing

```bash
# Check the API is running
curl http://localhost:3001/health

# Get preferences for a user (returns 404 on first call — expected)
curl "http://localhost:3001/api/preferences?username=guest"

# Save a quality preset
curl -X PUT http://localhost:3001/api/preferences \
  -H "Content-Type: application/json" \
  -d '{"username":"guest","qualityPreset":"high"}'

# Verify it saved
curl "http://localhost:3001/api/preferences?username=guest"
```

---

## CI: Appveyor Notes

The updated `appveyor.yml`:
- Uses Node 20 LTS (upgraded from Node 8)
- Declares `services: [postgresql]` for integration tests (DB: `presence_test`, user: `postgres`, password: `Password12!`)
- Builds workspaces in order: types → api → frontend
- Runs `npm run typecheck` before tests

No changes to the S3 deploy step for the frontend. The backend deploy step (Elastic Beanstalk) is documented in `appveyor.yml` but requires AWS EB environment setup separately.

---

## Adding a New Migration

```bash
# 1. Edit api/src/db/schema.ts
# 2. Generate the SQL migration
npm run migrate:generate -w api
# 3. Review the generated file in api/src/db/migrations/
# 4. Apply it locally
npm run migrate -w api
# 5. Commit both schema.ts and the migration file
```

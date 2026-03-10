import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userPreferences } from '../db/schema';
import { sendSuccess, sendError } from '../lib/response';
import type { UpdatePreferencesRequest, QualityPreset } from '@presence/types';

const VALID_PRESETS: QualityPreset[] = ['high', 'normal', 'low'];

export const preferencesRouter = Router();

preferencesRouter.get('/', async (req, res) => {
  const username = String(req.query['username'] ?? '').trim().toLowerCase();
  if (!username) {
    return sendError(res, 'username is required', 400, 'MISSING_USERNAME');
  }

  try {
    const rows = await db.select().from(userPreferences).where(eq(userPreferences.username, username));
    if (rows.length === 0) {
      return sendError(res, 'Not found', 404, 'NOT_FOUND');
    }
    const row = rows[0]!;
    return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset as QualityPreset });
  } catch {
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

preferencesRouter.put('/', async (req, res) => {
  const body = req.body as Partial<UpdatePreferencesRequest & { username: string }>;
  const username = String(body.username ?? '').trim().toLowerCase();
  if (!username) {
    return sendError(res, 'username is required', 400, 'MISSING_USERNAME');
  }

  const preset = body.qualityPreset;
  if (!preset || !VALID_PRESETS.includes(preset)) {
    return sendError(res, `qualityPreset must be one of: ${VALID_PRESETS.join(', ')}`, 400, 'INVALID_PRESET');
  }

  try {
    const now = new Date();
    const [row] = await db
      .insert(userPreferences)
      .values({ username, qualityPreset: preset, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: userPreferences.username,
        set: { qualityPreset: preset, updatedAt: new Date() },
      })
      .returning();

    if (!row) {
      return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }

    return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset as QualityPreset });
  } catch {
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

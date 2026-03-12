import { describe, it, expect } from 'vitest';
import {
  isApiSuccess,
  isApiError,
  isQualityPreset,
  type ApiResponse,
  type ApiSuccess,
  type ApiError,
  type QualityPreset,
  type UserPreferences,
  type UpdatePreferencesRequest,
} from '../index';

// ---------------------------------------------------------------------------
// isApiSuccess / isApiError — type guard correctness
// ---------------------------------------------------------------------------

describe('isApiSuccess', () => {
  it('returns true for a success response', () => {
    const res: ApiResponse<{ id: number }> = { success: true, data: { id: 1 } };
    expect(isApiSuccess(res)).toBe(true);
  });

  it('returns false for an error response', () => {
    const res: ApiResponse<never> = { success: false, error: 'Not found' };
    expect(isApiSuccess(res)).toBe(false);
  });

  it('narrows type so data is accessible without cast after guard', () => {
    const res: ApiResponse<string> = { success: true, data: 'hello' };
    if (isApiSuccess(res)) {
      // TypeScript would error here if narrowing failed — this also tests runtime value
      expect(res.data).toBe('hello');
    }
  });

  it('handles success response with undefined-like falsy data', () => {
    const res: ApiResponse<null> = { success: true, data: null };
    expect(isApiSuccess(res)).toBe(true);
  });
});

describe('isApiError', () => {
  it('returns true for an error response', () => {
    const res: ApiResponse<never> = { success: false, error: 'Unauthorized', code: 'AUTH_ERROR' };
    expect(isApiError(res)).toBe(true);
  });

  it('returns false for a success response', () => {
    const res: ApiResponse<number> = { success: true, data: 42 };
    expect(isApiError(res)).toBe(false);
  });

  it('narrows type so error and code are accessible without cast after guard', () => {
    const res: ApiResponse<never> = { success: false, error: 'Bad request', code: 'INVALID' };
    if (isApiError(res)) {
      expect(res.error).toBe('Bad request');
      expect(res.code).toBe('INVALID');
    }
  });

  it('handles error response with no optional code field', () => {
    const res: ApiResponse<never> = { success: false, error: 'Generic error' };
    if (isApiError(res)) {
      expect(res.code).toBeUndefined();
    }
  });

  it('isApiSuccess and isApiError are mutually exclusive', () => {
    const success: ApiResponse<number> = { success: true, data: 1 };
    const error: ApiResponse<never> = { success: false, error: 'oops' };
    expect(isApiSuccess(success) && isApiError(success)).toBe(false);
    expect(isApiSuccess(error) && isApiError(error)).toBe(false);
    expect(isApiSuccess(success) !== isApiError(success)).toBe(true);
    expect(isApiSuccess(error) !== isApiError(error)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isQualityPreset — type guard and serialization round-trip
// ---------------------------------------------------------------------------

describe('isQualityPreset', () => {
  it('accepts all three valid presets', () => {
    const validPresets: QualityPreset[] = ['high', 'normal', 'low'];
    for (const preset of validPresets) {
      expect(isQualityPreset(preset)).toBe(true);
    }
  });

  it('rejects strings that are not valid presets', () => {
    expect(isQualityPreset('medium')).toBe(false);
    expect(isQualityPreset('HIGH')).toBe(false);
    expect(isQualityPreset('')).toBe(false);
    expect(isQualityPreset('High')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isQualityPreset(null)).toBe(false);
    expect(isQualityPreset(undefined)).toBe(false);
    expect(isQualityPreset(0)).toBe(false);
    expect(isQualityPreset(true)).toBe(false);
    expect(isQualityPreset({ qualityPreset: 'high' })).toBe(false);
  });

  it('serialization round-trip: value from JSON.parse is guarded correctly', () => {
    // Simulates the real scenario: DB / localStorage returns an untyped string
    const stored = JSON.stringify('high');
    const parsed: unknown = JSON.parse(stored);
    expect(isQualityPreset(parsed)).toBe(true);
  });

  it('serialization round-trip: corrupt/unexpected value from JSON.parse is rejected', () => {
    const stored = JSON.stringify('ultra');
    const parsed: unknown = JSON.parse(stored);
    expect(isQualityPreset(parsed)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Shape correctness — structural tests for UserPreferences and UpdatePreferencesRequest
// ---------------------------------------------------------------------------

describe('UserPreferences shape', () => {
  it('accepts a fully-populated UserPreferences object', () => {
    const prefs: UserPreferences = { username: 'alice', qualityPreset: 'high' };
    expect(prefs.username).toBe('alice');
    expect(isQualityPreset(prefs.qualityPreset)).toBe(true);
  });
});

describe('UpdatePreferencesRequest shape', () => {
  it('accepts a valid UpdatePreferencesRequest', () => {
    const req: UpdatePreferencesRequest = { qualityPreset: 'normal' };
    expect(isQualityPreset(req.qualityPreset)).toBe(true);
  });
});

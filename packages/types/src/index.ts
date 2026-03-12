// API response envelope
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Type guard: narrows ApiResponse<T> to ApiSuccess<T> */
export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T> {
  return res.success === true;
}

/** Type guard: narrows ApiResponse<T> to ApiError */
export function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  return res.success === false;
}

// Quality preset enum
export type QualityPreset = 'high' | 'normal' | 'low';

const QUALITY_PRESETS: readonly QualityPreset[] = ['high', 'normal', 'low'];

/** Type guard: narrows unknown to QualityPreset */
export function isQualityPreset(value: unknown): value is QualityPreset {
  return typeof value === 'string' && (QUALITY_PRESETS as readonly string[]).includes(value);
}

// UserPreferences payload (used in GET and PUT responses)
export interface UserPreferences {
  username: string;
  qualityPreset: QualityPreset;
}

// PUT /api/preferences request body
export interface UpdatePreferencesRequest {
  qualityPreset: QualityPreset;
}

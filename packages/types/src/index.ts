// API response envelope
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Quality preset enum
export type QualityPreset = 'high' | 'normal' | 'low';

// UserPreferences payload (used in GET and PUT responses)
export interface UserPreferences {
  username: string;
  qualityPreset: QualityPreset;
}

// PUT /api/preferences request body
export interface UpdatePreferencesRequest {
  qualityPreset: QualityPreset;
}

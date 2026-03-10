export type ApiSuccess<T> = {
    success: true;
    data: T;
};
export type ApiError = {
    success: false;
    error: string;
    code?: string;
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type QualityPreset = 'high' | 'normal' | 'low';
export interface UserPreferences {
    username: string;
    qualityPreset: QualityPreset;
}
export interface UpdatePreferencesRequest {
    qualityPreset: QualityPreset;
}
//# sourceMappingURL=index.d.ts.map
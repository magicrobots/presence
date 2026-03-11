// frontend/src/types/canvas.ts
// Canonical canvas pipeline types for the tech debt refactor.

export interface GlowParams {
  enabled: boolean;
  useRandom: boolean;
  maxContrast: number | null;
  distance: number | null;
  falloff: {
    near: number | null;
    mid: number | null;
    far: number | null;
  };
}

export interface ShiftParams {
  enabled: boolean;
  positionFactor: number;
  factor: number;
  brightnessThreshold: number;
}

export interface PixelizeParams {
  adjustmentLarge: number;
  adjustmentSmall: number;
}

export interface DisplacementParams {
  bandCount: number;
  travelPixelsPerCycle: number;
}

export interface QualityLevelConfig {
  stride: 1 | 2 | 4;
  glow: GlowParams;
  shift: ShiftParams;
  pixelize: PixelizeParams;
  displacement: DisplacementParams;
}

/** Quality ladder is a readonly tuple of exactly 8 entries (levels 0–7) */
export type QualityLadder = readonly [
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
  QualityLevelConfig,
];

export type QualityLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// frontend/src/components/canvas/qualityAdapter.ts (referenced here for discoverability)

export interface QualityAdapterState {
  currentLevel: QualityLevel;
  /** Timestamp of last level change (for debounce) */
  lastTransitionMs: number;
  /** Min ms between consecutive transitions (default: 500) */
  debounceMs: number;
}

export interface QualityAdapterConfig {
  targetFps: number;
  headroomFps: number;
  stallThresholdMs: number;
  debounceMs: number;
}

export interface FrameMetrics {
  deltaMs: number;
  timestamp: number;
}

export type QualityTransition = 'upgrade' | 'downgrade' | 'emergency' | 'none';

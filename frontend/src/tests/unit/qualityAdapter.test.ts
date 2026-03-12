/**
 * Unit tests for the qualityAdapter module (FR-025).
 *
 * Tests are written against the public contract defined in
 * contracts/module-contracts.md §qualityAdapter — specifically:
 *   - createQualityAdapter(config): QualityAdapterState
 *   - evaluateQuality(state, metrics): { nextLevel, transition, nextState }
 *
 * Test coverage:
 *   1. Quality upgrade when FPS is comfortably above target + HEADROOM_FPS
 *   2. Quality downgrade when FPS is below target
 *   3. Emergency downgrade to level 7 on stall (deltaMs > stallThresholdMs)
 *   4. No transition when FPS is within the target band
 *   5. Oscillation prevention via debounce (lastTransitionMs guard)
 *   6. Level clamping — cannot go above 7 or below 0
 *   7. createQualityAdapter produces correct initial state from config
 *
 * These tests import from the future module path and will fail until T044
 * creates the typed exports — which is the intended TDD workflow.
 */

import { describe, it, expect } from 'vitest';
import {
  createQualityAdapter,
  evaluateQuality,
} from '../../components/canvas/qualityAdapter';
import type {
  QualityAdapterConfig,
  QualityAdapterState,
  FrameMetrics,
  QualityLevel,
  QualityTransition,
} from '../../types/canvas';

// ---------------------------------------------------------------------------
// Shared test config matching IzaComputer defaults from magic-numbers.ts
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: QualityAdapterConfig = {
  targetFps: 24,
  headroomFps: 10,
  stallThresholdMs: 3000,
  debounceMs: 500,
};

/** Build a FrameMetrics object from a target FPS (converts to deltaMs). */
function metricsAt(fps: number, timestamp = 10000): FrameMetrics {
  return { deltaMs: 1000 / fps, timestamp };
}

/** Build a FrameMetrics object from an explicit deltaMs. */
function metricsWithDelta(deltaMs: number, timestamp = 10000): FrameMetrics {
  return { deltaMs, timestamp };
}

// ---------------------------------------------------------------------------
// createQualityAdapter
// ---------------------------------------------------------------------------

describe('createQualityAdapter', () => {
  it('initializes currentLevel to 0 (maximum quality)', () => {
    const state = createQualityAdapter(DEFAULT_CONFIG);
    expect(state.currentLevel).toBe(0);
  });

  it('initializes lastTransitionMs to 0', () => {
    const state = createQualityAdapter(DEFAULT_CONFIG);
    expect(state.lastTransitionMs).toBe(0);
  });

  it('stores debounceMs from config', () => {
    const state = createQualityAdapter(DEFAULT_CONFIG);
    expect(state.debounceMs).toBe(DEFAULT_CONFIG.debounceMs);
  });

  it('uses a custom debounceMs value from config', () => {
    const custom: QualityAdapterConfig = { ...DEFAULT_CONFIG, debounceMs: 1000 };
    const state = createQualityAdapter(custom);
    expect(state.debounceMs).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — upgrade path
// ---------------------------------------------------------------------------

describe('evaluateQuality — upgrade', () => {
  it('upgrades quality (decrements level) when avgFps > targetFps + headroomFps', () => {
    // targetFps=24, headroomFps=10 → upgrade threshold = 34 fps
    // Running at 60 fps → avgFps 60 > 34 → should upgrade
    const state: QualityAdapterState = {
      currentLevel: 4 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 2000); // timestamp well past debounce
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('upgrade');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('steps level down by exactly 1 per upgrade call', () => {
    const state: QualityAdapterState = {
      currentLevel: 5 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextLevel).toBe(4 as QualityLevel);
  });

  it('clamps level at 0 (cannot upgrade past maximum quality)', () => {
    const state: QualityAdapterState = {
      currentLevel: 0 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 2000);
    const result = evaluateQuality(state, metrics);
    // Already at maximum quality — no upgrade possible
    expect(result.nextLevel).toBe(0 as QualityLevel);
    expect(result.transition).toBe<QualityTransition>('none');
  });

  it('returns updated nextState with new currentLevel on upgrade', () => {
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.currentLevel).toBe(result.nextLevel);
  });

  it('sets nextState.lastTransitionMs to metrics.timestamp on upgrade', () => {
    const state: QualityAdapterState = {
      currentLevel: 4 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 5000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.lastTransitionMs).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — downgrade path
// ---------------------------------------------------------------------------

describe('evaluateQuality — downgrade', () => {
  it('downgrades quality (increments level) when avgFps < targetFps', () => {
    // targetFps=24 → downgrade when fps < 24
    // Running at 10 fps → should downgrade
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('downgrade');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('steps level up by exactly 1 per downgrade call', () => {
    const state: QualityAdapterState = {
      currentLevel: 1 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextLevel).toBe(2 as QualityLevel);
  });

  it('clamps level at 7 (cannot downgrade past minimum quality)', () => {
    const state: QualityAdapterState = {
      currentLevel: 7 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(5, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextLevel).toBe(7 as QualityLevel);
    expect(result.transition).toBe<QualityTransition>('none');
  });

  it('returns updated nextState with new currentLevel on downgrade', () => {
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.currentLevel).toBe(result.nextLevel);
  });

  it('sets nextState.lastTransitionMs to metrics.timestamp on downgrade', () => {
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 8000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.lastTransitionMs).toBe(8000);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — hold (no transition)
// ---------------------------------------------------------------------------

describe('evaluateQuality — hold (FPS in target band)', () => {
  it('returns none transition when fps is exactly at targetFps', () => {
    // targetFps=24, headroomFps=10 → band is [24, 34]
    // fps=24 → exactly at target → no change
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(24, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('none');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('returns none transition when fps is within band (above target, below target+headroom)', () => {
    // fps=30 → 24 <= 30 <= 34 → hold
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(30, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('none');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('returns none transition at exactly target+headroom fps boundary', () => {
    // fps=34 → exactly at target+headroom → NOT above → no upgrade
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsAt(34, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('none');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('does not modify lastTransitionMs on hold', () => {
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 1000,
      debounceMs: 500,
    };
    const metrics = metricsAt(30, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.lastTransitionMs).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — emergency stall path
// ---------------------------------------------------------------------------

describe('evaluateQuality — emergency stall', () => {
  it('jumps to level 7 (minimum quality) when deltaMs > stallThresholdMs', () => {
    // stallThresholdMs=3000 → deltaMs=4000 triggers emergency
    const state: QualityAdapterState = {
      currentLevel: 0 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsWithDelta(4000, 5000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('emergency');
    expect(result.nextLevel).toBe(7 as QualityLevel);
  });

  it('emergency transition sets lastTransitionMs to current timestamp', () => {
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsWithDelta(5000, 9000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.lastTransitionMs).toBe(9000);
  });

  it('does NOT trigger emergency when deltaMs equals stallThresholdMs (strict >)', () => {
    // stallThresholdMs=3000 → deltaMs=3000 (not strictly greater) → normal path
    const state: QualityAdapterState = {
      currentLevel: 0 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const metrics = metricsWithDelta(3000, 5000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).not.toBe<QualityTransition>('emergency');
  });

  it('emergency overrides debounce — fires even when lastTransitionMs is recent', () => {
    // debounce would normally suppress a transition here
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 4800, // only 200ms ago
      debounceMs: 500,
    };
    const metrics = metricsWithDelta(5000, 5000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('emergency');
    expect(result.nextLevel).toBe(7 as QualityLevel);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — oscillation prevention (debounce)
// ---------------------------------------------------------------------------

describe('evaluateQuality — oscillation prevention (debounce)', () => {
  it('suppresses downgrade when within debounce window', () => {
    // lastTransitionMs=9700, timestamp=10000 → elapsed=300ms < debounceMs=500 → suppress
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 9700,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 10000); // low fps → would downgrade but debounced
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('none');
    expect(result.nextLevel).toBe(2 as QualityLevel);
  });

  it('suppresses upgrade when within debounce window', () => {
    // lastTransitionMs=9600, timestamp=10000 → elapsed=400ms < debounceMs=500 → suppress
    const state: QualityAdapterState = {
      currentLevel: 4 as QualityLevel,
      lastTransitionMs: 9600,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 10000); // high fps → would upgrade but debounced
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('none');
    expect(result.nextLevel).toBe(4 as QualityLevel);
  });

  it('allows downgrade exactly when debounce window expires', () => {
    // lastTransitionMs=9500, timestamp=10000 → elapsed=500ms === debounceMs → allow
    const state: QualityAdapterState = {
      currentLevel: 2 as QualityLevel,
      lastTransitionMs: 9500,
      debounceMs: 500,
    };
    const metrics = metricsAt(10, 10000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('downgrade');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('allows upgrade after debounce window expires', () => {
    // lastTransitionMs=9000, timestamp=10000 → elapsed=1000ms > debounceMs=500 → allow
    const state: QualityAdapterState = {
      currentLevel: 4 as QualityLevel,
      lastTransitionMs: 9000,
      debounceMs: 500,
    };
    const metrics = metricsAt(60, 10000);
    const result = evaluateQuality(state, metrics);
    expect(result.transition).toBe<QualityTransition>('upgrade');
    expect(result.nextLevel).toBe(3 as QualityLevel);
  });

  it('prevents oscillation: downgrade then immediate upgrade is blocked', () => {
    const config: QualityAdapterConfig = { ...DEFAULT_CONFIG, debounceMs: 500 };
    let state = createQualityAdapter(config);
    // Move to level 3 first
    state = { ...state, currentLevel: 3 as QualityLevel };

    // Frame 1: low FPS → downgrade to level 4
    const frame1 = metricsAt(10, 1000);
    const result1 = evaluateQuality(state, frame1);
    expect(result1.transition).toBe<QualityTransition>('downgrade');
    expect(result1.nextLevel).toBe(4 as QualityLevel);

    // Frame 2: immediately high FPS (300ms later — within debounce) → upgrade suppressed
    const frame2 = metricsAt(60, 1300);
    const result2 = evaluateQuality(result1.nextState, frame2);
    expect(result2.transition).toBe<QualityTransition>('none');
    expect(result2.nextLevel).toBe(4 as QualityLevel);

    // Frame 3: high FPS after debounce expires (600ms after last transition) → upgrade allowed
    const frame3 = metricsAt(60, 1600);
    const result3 = evaluateQuality(result2.nextState, frame3);
    expect(result3.transition).toBe<QualityTransition>('upgrade');
    expect(result3.nextLevel).toBe(3 as QualityLevel);
  });

  it('nextState preserves debounceMs across calls', () => {
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 750,
    };
    const metrics = metricsAt(10, 2000);
    const result = evaluateQuality(state, metrics);
    expect(result.nextState.debounceMs).toBe(750);
  });
});

// ---------------------------------------------------------------------------
// evaluateQuality — pure function guarantees
// ---------------------------------------------------------------------------

describe('evaluateQuality — pure function (no mutation)', () => {
  it('does not mutate the input state object', () => {
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const originalLevel = state.currentLevel;
    const originalTs = state.lastTransitionMs;

    evaluateQuality(state, metricsAt(10, 2000));

    expect(state.currentLevel).toBe(originalLevel);
    expect(state.lastTransitionMs).toBe(originalTs);
  });

  it('returns a new nextState object (not the same reference as input state)', () => {
    const state: QualityAdapterState = {
      currentLevel: 3 as QualityLevel,
      lastTransitionMs: 0,
      debounceMs: 500,
    };
    const result = evaluateQuality(state, metricsAt(10, 2000));
    expect(result.nextState).not.toBe(state);
  });
});

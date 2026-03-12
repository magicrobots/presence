/**
 * Quality adapter — stub for T042 test typecheck.
 *
 * This file satisfies the TypeScript import resolution required by
 * qualityAdapter.test.ts (T042). The real implementation is delivered by T044.
 *
 * Contract: contracts/module-contracts.md §qualityAdapter
 */

import type {
  QualityAdapterConfig,
  QualityAdapterState,
  FrameMetrics,
  QualityLevel,
  QualityTransition,
} from '../../types/canvas';

/** Initialize adapter state from config */
export function createQualityAdapter(config: QualityAdapterConfig): QualityAdapterState {
  return {
    currentLevel: 0 as QualityLevel,
    lastTransitionMs: 0,
    debounceMs: config.debounceMs,
  };
}

/**
 * Evaluate whether a quality transition should occur given the latest frame metrics.
 * Returns the new level and the transition type. Pure function — no side effects.
 *
 * Algorithm (from IzaComputer.jsx bidirectional quality evaluation loop):
 *   - Emergency stall: deltaMs > stallThresholdMs → jump to level 7, transition='emergency'
 *   - Debounce guard: if (timestamp - lastTransitionMs) < debounceMs → transition='none'
 *   - avgFps derived from single deltaMs: avgFps = 1000 / deltaMs
 *   - avgFps < targetFps                       → downgrade (level+1, max 7)
 *   - avgFps > targetFps + headroomFps         → upgrade   (level-1, min 0)
 *   - otherwise                                → hold, transition='none'
 */
export function evaluateQuality(
  state: QualityAdapterState,
  metrics: FrameMetrics,
): { nextLevel: QualityLevel; transition: QualityTransition; nextState: QualityAdapterState } {
  const { currentLevel, lastTransitionMs, debounceMs } = state;
  const { deltaMs, timestamp } = metrics;

  // Emergency stall: single frame took too long
  if (deltaMs > 3000) {
    const nextLevel = 7 as QualityLevel;
    return {
      nextLevel,
      transition: 'emergency',
      nextState: { ...state, currentLevel: nextLevel, lastTransitionMs: timestamp },
    };
  }

  // Debounce guard: suppress normal transitions within the debounce window
  const elapsed = timestamp - lastTransitionMs;
  if (elapsed < debounceMs) {
    return {
      nextLevel: currentLevel,
      transition: 'none',
      nextState: { ...state },
    };
  }

  const avgFps = 1000 / deltaMs;
  const targetFps = 24;
  const headroomFps = 10;

  if (avgFps < targetFps) {
    const next = Math.min(7, currentLevel + 1) as QualityLevel;
    if (next === currentLevel) {
      return { nextLevel: currentLevel, transition: 'none', nextState: { ...state } };
    }
    return {
      nextLevel: next,
      transition: 'downgrade',
      nextState: { ...state, currentLevel: next, lastTransitionMs: timestamp },
    };
  }

  if (avgFps > targetFps + headroomFps) {
    const next = Math.max(0, currentLevel - 1) as QualityLevel;
    if (next === currentLevel) {
      return { nextLevel: currentLevel, transition: 'none', nextState: { ...state } };
    }
    return {
      nextLevel: next,
      transition: 'upgrade',
      nextState: { ...state, currentLevel: next, lastTransitionMs: timestamp },
    };
  }

  return {
    nextLevel: currentLevel,
    transition: 'none',
    nextState: { ...state },
  };
}

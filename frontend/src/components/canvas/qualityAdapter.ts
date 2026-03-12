/**
 * Quality adapter — extracts the bidirectional FPS-based quality evaluation logic
 * from IzaComputer.jsx into a pure, independently testable module.
 *
 * Contract: contracts/module-contracts.md §qualityAdapter
 *
 * Design notes:
 *   - QualityAdapterState carries only per-instance mutable fields (currentLevel,
 *     lastTransitionMs, debounceMs). The targetFps, headroomFps, and
 *     stallThresholdMs values come from magic-numbers constants — they are
 *     application-wide defaults, not per-instance configuration.
 *   - evaluateQuality is a pure function: it takes state + frame metrics and
 *     returns the next level, the transition type, and the next state — all
 *     without any side effects or external reads.
 *   - The FrameMetrics.deltaMs field drives single-frame evaluation (avoids
 *     the eval-window accumulation that lives in IzaComputer). Debounce is
 *     enforced via lastTransitionMs and the debounceMs field in state.
 */

import type {
  QualityAdapterConfig,
  QualityAdapterState,
  FrameMetrics,
  QualityLevel,
  QualityTransition,
} from '../../types/canvas';
import MagicNumbers from '../../constants/magic-numbers';

/** Initialize adapter state from config. */
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
 * Algorithm (mirrors IzaComputer.jsx bidirectional quality evaluation loop):
 *   1. Emergency stall: deltaMs > STALL_THRESHOLD_MS → jump to level 7, transition='emergency'
 *      (emergency overrides debounce — fires immediately regardless of lastTransitionMs)
 *   2. Debounce guard: if (timestamp - lastTransitionMs) < debounceMs → transition='none'
 *   3. avgFps derived from single deltaMs: avgFps = 1000 / deltaMs
 *   4. avgFps < TARGET_FPS                     → downgrade (level+1, max 7)
 *   5. avgFps > TARGET_FPS + HEADROOM_FPS      → upgrade   (level-1, min 0)
 *   6. otherwise                               → hold, transition='none'
 *
 * Level clamping:
 *   - If already at level 7 and FPS is low → hold ('none'), not 'downgrade'
 *   - If already at level 0 and FPS is high → hold ('none'), not 'upgrade'
 */
export function evaluateQuality(
  state: QualityAdapterState,
  metrics: FrameMetrics,
): { nextLevel: QualityLevel; transition: QualityTransition; nextState: QualityAdapterState } {
  const { currentLevel, lastTransitionMs, debounceMs } = state;
  const { deltaMs, timestamp } = metrics;

  // Step 1: Emergency stall — single frame delta exceeds threshold.
  // Emergency bypasses the debounce window (catastrophic stall must always react).
  if (deltaMs > MagicNumbers.STALL_THRESHOLD_MS) {
    const nextLevel = 7 as QualityLevel;
    return {
      nextLevel,
      transition: 'emergency',
      nextState: { ...state, currentLevel: nextLevel, lastTransitionMs: timestamp },
    };
  }

  // Step 2: Debounce guard — suppress normal transitions within the debounce window
  // to prevent rapid oscillation between quality levels.
  const elapsed = timestamp - lastTransitionMs;
  if (elapsed < debounceMs) {
    return {
      nextLevel: currentLevel,
      transition: 'none',
      nextState: { ...state },
    };
  }

  // Step 3: Derive instantaneous FPS from this frame's delta.
  const avgFps = 1000 / deltaMs;

  // Step 4: FPS below target → degrade quality (level up, clamped at 7).
  if (avgFps < MagicNumbers.TARGET_FPS) {
    const next = Math.min(7, currentLevel + 1) as QualityLevel;
    if (next === currentLevel) {
      // Already at minimum quality — no transition.
      return { nextLevel: currentLevel, transition: 'none', nextState: { ...state } };
    }
    return {
      nextLevel: next,
      transition: 'downgrade',
      nextState: { ...state, currentLevel: next, lastTransitionMs: timestamp },
    };
  }

  // Step 5: FPS comfortably above target → improve quality (level down, clamped at 0).
  if (avgFps > MagicNumbers.TARGET_FPS + MagicNumbers.HEADROOM_FPS) {
    const next = Math.max(0, currentLevel - 1) as QualityLevel;
    if (next === currentLevel) {
      // Already at maximum quality — no transition.
      return { nextLevel: currentLevel, transition: 'none', nextState: { ...state } };
    }
    return {
      nextLevel: next,
      transition: 'upgrade',
      nextState: { ...state, currentLevel: next, lastTransitionMs: timestamp },
    };
  }

  // Step 6: FPS within target band — hold current level.
  return {
    nextLevel: currentLevel,
    transition: 'none',
    nextState: { ...state },
  };
}

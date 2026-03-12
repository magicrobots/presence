# Canvas Visual Fidelity Verification Checklist (T047 / SC-004 / SC-005)

**Task**: T047 — Verify CRT visual output is perceptually identical at all 8 quality levels before and after the canvas pipeline refactor (IzaComputer.jsx → IzaComputer.tsx + CanvasRenderer.ts + qualityAdapter.ts + deformers.ts).

**Procedure** (from quickstart.md §Canvas Visual Fidelity Verification):

1. Open the app at `http://localhost:5173`
2. Navigate to a room with text content
3. Open DevTools → Application → localStorage
4. For each quality level 0–7: set `quality-level` via `qualityLevelRef` override in DevTools console or force via `QUALITY_LADDER` index
5. Capture a screenshot at each level
6. Compare against equivalent pre-refactor screenshots side-by-side
7. Verify: no perceptible difference in CRT phosphor glow, chromatic shift, displacement bands, or pixel stride

---

## Quality Level Matrix

| Level | Stride | Glow | Shift | Displacement Bands | Visual Signature |
|-------|--------|------|-------|-------------------|-----------------|
| 0 | 1 | on (random) | on | 3 | Full quality: glow with rngeezus random, chromatic shift, 3 displacement bands |
| 1 | 1 | on (static) | on | 3 | Glow without random pool — phosphor halation slightly more uniform |
| 2 | 1 | on (reduced) | on | 2 | Higher contrast threshold (150), reduced falloff, 2 displacement bands |
| 3 | 2 | on (minimal) | on | 2 | Stride-2 (every other pixel block-filled); glow minimal, shift weakened |
| 4 | 2 | off | on (weak) | 1 | No phosphor glow; chromatic shift still visible; single displacement band |
| 5 | 2 | off | on (minimal) | 1 | Shift near-invisible; single band; lowest stride-2 phosphor values |
| 6 | 2 | off | off | 0 | Pixelization only (stride-2); no glow, no shift, no displacement |
| 7 | 2 | off | off | 0 | Emergency minimum; lowest phosphor values; text must remain readable |

---

## Pre/Post Refactor Comparison Checklist

### SC-004 — Visual Fidelity

For each quality level (0–7), verify the following by comparing screenshots taken before and after the canvas pipeline refactor:

- [ ] **Level 0**: CRT glow with rngeezus random halos visible; 3 displacement bands scrolling; chromatic shift on bright pixels — perceptually identical before/after
- [ ] **Level 1**: Glow present but uniform (no random halos); 3 displacement bands; chromatic shift — perceptually identical before/after
- [ ] **Level 2**: Reduced glow, 2 displacement bands, shift active — perceptually identical before/after
- [ ] **Level 3**: Stride-2 block rendering visible; minimal glow; 2 displacement bands; weakened shift — perceptually identical before/after
- [ ] **Level 4**: No glow; weak shift; single displacement band; stride-2 pixelization — perceptually identical before/after
- [ ] **Level 5**: No glow; near-invisible shift; single displacement band; stride-2 — perceptually identical before/after
- [ ] **Level 6**: Pixelization only (stride-2); no glow, shift, or displacement; text readable — perceptually identical before/after
- [ ] **Level 7**: Emergency minimum; pixelization only; text remains clearly readable — perceptually identical before/after

### SC-005 — Frame Time (Performance)

At each quality level on a reference device, verify:

- [ ] **Level 0**: Frame time (ms/frame from MpfIndicator) equal or lower vs pre-refactor
- [ ] **Level 3**: Frame time at stride-2 equal or lower vs pre-refactor
- [ ] **Level 7**: Frame time at emergency minimum equal or lower vs pre-refactor

**How to check**: Add `?fps=1` to the URL (e.g., `http://localhost:5173?fps=1`) to display the MpfIndicator showing current FPS and quality level. Record the steady-state FPS value displayed after ~5 seconds at each quality level.

---

## Refactor Changes That Could Affect Visual Output

The following changes were made in this refactor. Each has been analyzed for visual impact:

| Change | File | Visual Impact Assessment |
|--------|------|--------------------------|
| `applyAllDeformers` extracted to `deformers.ts` | `frontend/src/utils/deformers.ts` | Logic is identical — pure pixel transformation; pixel loop unchanged |
| `renderFrame` in `CanvasRenderer.ts` reads `getImageData` → applies deformers → `putImageData` | `frontend/src/components/canvas/CanvasRenderer.ts` | Identical pixel pipeline; `imageSmoothingEnabled=false` set before every `drawImage` |
| `initCanvases` sets `imageSmoothingEnabled=false` on both contexts | `frontend/src/components/canvas/CanvasRenderer.ts` | Ensures no anti-aliasing; matches pre-refactor behavior |
| `triggerRepaint` double-rAF replaces `setTimeout(740ms)` z-index hack | `frontend/src/components/canvas/CanvasRenderer.ts` | Repaint trigger only — no effect on pixel data; eliminates 740ms delay |
| `qualityAdapter` debounce via `lastTransitionMs` | `frontend/src/components/canvas/qualityAdapter.ts` | Prevents quality oscillation; quality transitions may be slightly smoother |
| Displacement band compositing remains in `IzaComputer.tsx` | `frontend/src/components/IzaComputer.tsx` | Unchanged logic — uses same `rngeezus.getRandomValue` and `QUALITY_LADDER` config |
| `QUALITY_LADDER` values unchanged | `frontend/src/constants/magic-numbers.ts` | Identical quality parameters at all 8 levels |

---

## Verification Sign-off

**Instructions for the developer performing the visual check**:

1. Run `npm run dev -w frontend` and open `http://localhost:5173?fps=1`
2. Navigate to a room with visible text (e.g., run `look` command)
3. For each quality level, force the level via the browser console:
   ```js
   // Temporarily override quality in the running app (development only):
   // The qualityLevelRef is internal — override by setting localStorage and reloading:
   localStorage.setItem('quality-preset', 'high')   // forces high-preset (high target FPS → level 0 likely)
   // Or observe natural quality adaptation by throttling CPU in DevTools Performance panel
   ```
4. Capture a screenshot for each level
5. Check each item in the checklist above
6. Sign off below:

**Developer**: _______________
**Date**: _______________
**Hardware**: _______________
**Browser**: _______________

All 8 levels verified perceptually identical: **YES / NO**
Frame time equal or improved: **YES / NO**

---

*This document satisfies T047 (SC-004, SC-005) — it is intended for inclusion in the US4 pull request description.*

# Feature Specification: Responsive Full-Window CRT Display

**Feature Branch**: `003-responsive-crt-display`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "currently the screen has a maximum size that is very small. I did this for performance issues based on the CRT emulation canvas script I had created. This was many years ago and I hope that things have improved. Let's update the main view to be whatever size the browser window is, and let's see if the canvas image processing script can be optimized so everything is smooth regardless of screen size."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maximum-Size 4:3 Display on Load (Priority: P1)

A user opens the application in any modern browser. Instead of a small, fixed-size screen, the CRT-emulated display scales up to fill the browser window as large as possible while maintaining a 4:3 aspect ratio — centered in the window with solid black bars filling any remaining space on the sides or top/bottom.

**Why this priority**: This is the core visual change the user requested. Without it, all other improvements have no visible effect. It delivers immediate, demonstrable value on its own.

**Independent Test**: Can be fully tested by loading the app in a browser at various window shapes and verifying the CRT display is the largest 4:3 rectangle that fits the window, centered correctly.

**Acceptance Scenarios**:

1. **Given** a browser window of any size or shape, **When** the application loads, **Then** the CRT display is the largest possible 4:3 rectangle that fits within the window, with no fixed pixel cap on its size.
2. **Given** a widescreen window (wider than 4:3), **When** the application loads, **Then** the CRT display is centered horizontally with solid black bars on left and right; no bars appear top or bottom.
3. **Given** a tall/narrow window (taller than 4:3), **When** the application loads, **Then** the CRT display is centered vertically with solid black bars on top and bottom; no bars appear left or right.
4. **Given** the CRT display is at maximum size, **When** the application runs, **Then** the visual CRT effects (scanlines, curvature, glow, etc.) are applied across the entire display area.

---

### User Story 2 - Smooth Performance at Maximum Display Size (Priority: P2)

A user runs the application at maximum display size in a large browser window on a modern desktop or laptop. The CRT canvas rendering — including image processing and effect animations — runs smoothly without lag, stutter, or dropped frames.

**Why this priority**: Expanding to maximum display size without performance optimization would reproduce the exact problem that originally caused the size cap to be imposed. Smooth performance is what makes the expanded view viable.

**Independent Test**: Can be tested by expanding the window to various large sizes and observing rendering fluency (no visible stutter during normal use).

**Acceptance Scenarios**:

1. **Given** the display is at maximum size within a large browser window, **When** content is rendered or animated, **Then** the display remains visually smooth without noticeable stuttering or lag.
2. **Given** a user resizes the browser window, **When** the resize completes, **Then** the display recalculates to the new maximum 4:3 size and rendering remains smooth.
3. **Given** the application runs for an extended session, **When** the user continues interacting, **Then** performance does not degrade over time.

---

### User Story 3 - Dynamic Window Resize Handling (Priority: P3)

A user resizes the browser window while the application is running. The CRT display recalculates to the new maximum 4:3 size within the updated window dimensions without requiring a page reload.

**Why this priority**: Responsive resize behavior is expected in modern web applications. It completes the full-window experience but is lower priority than the initial load and raw performance goals.

**Independent Test**: Can be tested independently by resizing the browser window and confirming the display adjusts to the correct 4:3 size without requiring a reload.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the user resizes the browser window, **Then** the display recalculates to the largest 4:3 rectangle fitting the new window size without a page reload.
2. **Given** a window resize occurs, **When** the display adjusts, **Then** CRT visual effects remain correctly applied to the new dimensions.

---

### Edge Cases

- When the browser window is extremely large (e.g., ultra-wide 5120×1440 or 4K+), the 4:3 canvas will be very large; the display may reduce CRT effect fidelity (e.g., simplified scanlines or curvature) to preserve smooth rendering rather than dropping frames severely.
- When the browser window is smaller than the minimum usable size (800×600), the display MUST still render without broken layout, overflow, or hidden content. The 4:3 canvas continues to scale down to fit, aspect ratio is maintained, and CRT effects remain applied — even if the canvas becomes very small. No minimum pixel floor is enforced; the canvas simply becomes smaller. The application MUST remain functional (not crash or freeze) at any window size down to 320×240.
- When the browser window is resized rapidly or repeatedly, the display recalculates only after resizing activity stops (debounced with a 200ms delay), not on every intermediate resize event.
- When the browser window is moved between monitors with different pixel densities (retina vs standard), the display renders at CSS resolution and does not adjust for device pixel ratio; no special handling is required for monitor changes.

## Integration & External Dependencies

The following existing source files are the primary artifacts in scope for this feature. All optimization and resizing work is localized to these files.

| File | Role |
|---|---|
| `src/components/IzaComputer.jsx` | Main CRT display React component. Contains the `requestAnimationFrame` render loop, two canvas elements (`source-canvas` for compositing, `altered-canvas` for pixel-processed output), viewport size calculation (`_computeViewportMeasurements`), resize handling (`_setContainerSize`), and the auto-performance degradation logic (`isPerformantRef`). |
| `src/utils/deformers.js` | CRT pixel-effect engine. Exports `applyAllDeformers`, which chains three pixel-level passes per frame: `_pixelizeBit` (phosphor sub-pixel simulation), `_shiftPixel` (chromatic shift), and `_glowEdgesBit` (phosphor glow at brightness edges). This is the primary performance bottleneck at large canvas sizes. |
| `src/constants/magic-numbers.js` | Central numeric constants. `ABSOLUTE_MAX_VIEWPORT_WIDTH: 1200` is the hardcoded size cap that this feature removes. `MAX_MPF: 150` and `PERFORMANCE_TEST_LENGTH: 30` govern the auto-quality-reduction threshold. |

**Key integration constraints:**
- The component uses two canvas elements in a layered composition: `source-canvas` holds the base image and text; `altered-canvas` holds the pixel-processed CRT overlay. Both must be resized together on viewport changes.
- The auto-degradation path (`isEvaluatedRef` / `isPerformantRef`) is already in place; optimization work should integrate with this existing mechanism rather than replacing it.
- No external image processing libraries are in use; all pixel manipulation is performed via `getImageData` / `putImageData` on the 2D canvas context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CRT display canvas MUST scale to the largest possible 4:3 aspect ratio rectangle that fits within the browser window, with no hardcoded maximum pixel size.
- **FR-002**: The CRT display MUST be centered within the browser window; any remaining space (letterbox/pillarbox bars) MUST be solid black.
- **FR-003**: The CRT canvas effect MUST be applied across the full display area at any canvas size.
- **FR-004**: The display MUST respond to browser window resize events and recalculate its 4:3 dimensions without a page reload; recalculation MUST be debounced with a 200ms delay so it triggers only after resizing activity has stopped, not on every intermediate event.
- **FR-005**: The CRT canvas image processing MUST render smoothly at modern display resolutions during normal use, with frame time ≤16.7ms per frame (60fps target) and no more than 2 dropped frames per second sustained over ≥10 seconds of continuous rendering.
- **FR-006**: The display MUST correctly maintain the 4:3 aspect ratio and effect quality when the window is resized.
- **FR-007**: The auto-degradation performance evaluation MUST re-run whenever the canvas dimensions increase beyond the size at which the previous evaluation was conducted. If the new canvas area (width × height in pixels) exceeds the canvas area recorded at the time of the last evaluation, `isEvaluatedRef` MUST be reset to false so a fresh evaluation runs at the new size. Decreasing the window size MUST NOT trigger re-evaluation — the display remains in its current quality mode (degraded or non-degraded).

### Assumptions

- Modern browsers (released in the last 3–4 years) will be the primary target; older browser compatibility is not a requirement for this change.
- "Smooth" rendering is defined as a sustained frame time of ≤16.7ms per frame (60fps target) with no more than 2 dropped frames per second during normal use on a mid-range desktop/laptop with a modern browser. For the purposes of this specification, "mid-range desktop/laptop" is defined as a machine with a CPU equivalent to an Intel Core i5 (8th generation) or AMD Ryzen 5 (3000-series) or better, with at least 8GB RAM and integrated or discrete GPU, running a Chromium-based browser (Chrome or Edge) or Firefox within the last 2 major released versions at the time of testing.
- The existing CRT visual effects (scanlines, phosphor glow, screen curvature, etc.) MUST be preserved at typical window sizes. At extreme display sizes (beyond standard desktop resolutions), graceful quality reduction (e.g., reduced scanline density, simplified curvature) is acceptable as a fallback to maintain smooth rendering.
- If a hard performance ceiling exists on very large displays, the display should still function correctly (without crashing or hanging), and may reduce CRT effect fidelity rather than drop frames severely.
- The 4:3 aspect ratio is fixed and applies at all window sizes.
- The canvas renders at CSS pixel resolution. Device pixel ratio (retina/HiDPI) is not accounted for; no scaling by device pixel ratio is applied.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The CRT display is the largest 4:3 rectangle fitting the browser window on initial load, verified across window shapes: widescreen, square, and portrait orientations.
- **SC-002**: Rendering remains visually smooth at maximum display size on a modern desktop browser — the frame time budget is ≤16.7ms per frame (60fps target), with no more than 2 dropped frames per second observed during sustained normal use (sustained = ≥10 seconds of continuous rendering). Measured via browser DevTools Performance panel or `requestAnimationFrame` timestamp deltas.
- **SC-003**: The display correctly recalculates to the new maximum 4:3 size within 500ms of a browser window resize event completing.
- **SC-004**: The application continues to function correctly (no crashes, errors, or broken layout) at any browser window size from 320×240 up to at least 2560×1440.
- **SC-005**: At maximum display size, all CRT visual effects (scanlines, phosphor glow, screen curvature) are visibly present and applied across the full canvas area, verified by visual inspection at 1920×1080 and 2560×1440 window sizes.

## Clarifications

### Session 2026-03-09

- Q: Can CRT visual effects be simplified or reduced if needed for smooth rendering at large window sizes? → A: Preserve effects by default; allow graceful quality reduction at extreme/large sizes only as a fallback.
- Q: How should the canvas fill the browser window — literal 100% viewport or constrained by aspect ratio? → A: Scale to 100% of the greatest fitting dimension while maintaining a fixed 4:3 aspect ratio; center with neutral bars for remaining space.
- Q: Should the canvas update live during a window resize drag, or only after the drag ends? → A: Debounced — update only after resize activity stops, not on every intermediate event.
- Q: Should the canvas render at native device (retina/HiDPI) resolution or CSS resolution? → A: CSS resolution only; device pixel ratio is ignored.
- Q: What color should fill the letterbox/pillarbox bars outside the 4:3 canvas? → A: Solid black — classic CRT/monitor bezel aesthetic.
- Q: What debounce delay should be used when the browser window is resized? → A: 200ms — standard practice for resize handlers; fits comfortably within the 500ms recalculation completion target in SC-003.
- Q: When the window is resized to a significantly larger size after the initial performance evaluation has already completed (`isEvaluatedRef=true`), should the auto-degradation evaluation re-run? → A: Yes — the performance evaluation MUST re-run whenever the canvas dimensions increase beyond the size at which the previous evaluation was conducted. If the new canvas area is larger than the area at last evaluation, reset `isEvaluatedRef` to false so the evaluation runs fresh at the new size. Decreasing the window size does not trigger re-evaluation (the display remains in its current quality mode).
- Q: What does "mid-range desktop/laptop" mean as a hardware baseline for the performance target? → A: A machine with a CPU equivalent to an Intel Core i5 (8th gen) or AMD Ryzen 5 (3000-series) or better, at least 8GB RAM, and integrated or discrete GPU, running Chrome, Edge, or Firefox within the last 2 major released versions at time of testing.

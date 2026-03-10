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

A user runs the application at maximum display size in a large browser window on any device. The CRT canvas rendering continuously monitors its own frame rate and adjusts effect quality up or down to stay at the target FPS — defaulting to 30fps (Normal preset), which is smooth enough for CRT animation without taxing the device unnecessarily. If the device has headroom above the target, quality can increase; if it falls under load, quality reduces. The loop runs for the lifetime of the session.

**Why this priority**: Expanding to maximum display size without performance optimization would reproduce the exact problem that originally caused the size cap to be imposed. Continuous self-adjustment is what makes the expanded view viable on any device.

**Independent Test**: Can be tested by expanding the window to various large sizes and observing that rendering stays smooth. Throttling the CPU mid-session should cause quality to reduce; removing the throttle should allow quality to recover.

**Acceptance Scenarios**:

1. **Given** the display is at maximum size within a large browser window, **When** content is rendered or animated, **Then** the display remains visually smooth at the target FPS without noticeable stuttering or lag.
2. **Given** a user resizes the browser window, **When** the resize completes, **Then** the display recalculates to the new maximum 4:3 size and the quality adaptation loop continues running at the current quality level.
3. **Given** the application is running and the host machine's available CPU/GPU resources change (e.g., another process starts competing), **When** the performance monitor detects the FPS has dropped below the target, **Then** the quality level is reduced within the next evaluation cycle — and raised again once headroom is detected — without any user intervention required.

---

### User Story 3 - Quality Preset Control (Priority: P3)

A user opens the application settings (cmd-settings) and selects a quality preset — High, Normal, or Low — to control the rendering target. Normal (30fps) is the default and suits most devices without overworking them. High (60fps target) raises the bar so the adapter runs at higher quality when the device can sustain it. Low (15fps target) keeps the device cool on constrained hardware. The selected preset immediately takes effect on the next evaluation cycle.

**Why this priority**: Giving the user agency over the performance target is a lightweight way to support a wide range of devices without adding complex auto-detection logic. The adapter still does all the work; the preset just sets the goal.

**Independent Test**: Can be tested by switching presets in settings and observing that the target FPS changes and the adapter adjusts quality accordingly.

**Acceptance Scenarios**:

1. **Given** the user navigates to the settings route, **When** they view the display settings, **Then** a quality preset selector is visible with three options: High, Normal (selected by default), and Low.
2. **Given** the user selects a quality preset, **When** the next evaluation cycle runs, **Then** the target FPS used by the performance monitor reflects the selected preset (High=60fps, Normal=30fps, Low=15fps).
3. **Given** the user selects High preset on a capable device, **When** the adapter evaluates frame performance, **Then** the quality level rises until the device is rendering at or near 60fps or has reached full quality level.
4. **Given** the user selects Low preset, **When** the adapter evaluates frame performance, **Then** the quality level is reduced until frame time is comfortably within the 15fps (67ms) budget, preventing unnecessary GPU/CPU load.

---

### User Story 4 - Dynamic Window Resize Handling (Priority: P4)

A user resizes the browser window while the application is running. The CRT display recalculates to the new maximum 4:3 size within the updated window dimensions without requiring a page reload.

**Why this priority**: Responsive resize behavior is expected in modern web applications. It completes the full-window experience but is lower priority than the initial load, performance, and quality control goals.

**Independent Test**: Can be tested independently by resizing the browser window and confirming the display adjusts to the correct 4:3 size without requiring a reload.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the user resizes the browser window, **Then** the display recalculates to the largest 4:3 rectangle fitting the new window size without a page reload.
2. **Given** a window resize occurs, **When** the display adjusts, **Then** CRT visual effects remain correctly applied to the new dimensions.

---

### Edge Cases

- When the browser window is extremely large (e.g., ultra-wide 5120×1440 or 4K+), the 4:3 canvas will be very large; the continuous quality adapter will reduce the quality level as needed to keep frame time within the target budget — this is normal adapter behavior, not an error condition.
- When any single frame takes longer than 3 seconds to draw (a stall, not merely a slow frame), the system MUST treat this as an emergency: immediately drop to the lowest quality level and restart the evaluation cycle. The 3-second threshold is distinct from the normal per-cycle evaluation — it triggers without waiting for the next 3-second window.
- When the browser window is smaller than the minimum usable size (800×600), the display MUST still render without broken layout, overflow, or hidden content. The 4:3 canvas continues to scale down to fit, aspect ratio is maintained, and CRT effects remain applied — even if the canvas becomes very small. No minimum pixel floor is enforced; the canvas simply becomes smaller. The application MUST remain functional (not crash or freeze) at any window size down to 320×240.
- When the browser window is resized rapidly or repeatedly, the display recalculates only after resizing activity stops (debounced with a 200ms delay), not on every intermediate resize event.
- When the browser window is moved between monitors with different pixel densities (retina vs standard), the display renders at CSS resolution and does not adjust for device pixel ratio; no special handling is required for monitor changes.

## Integration & External Dependencies

The following existing source files are the primary artifacts in scope for this feature. All optimization and resizing work is localized to these files.

| File | Role |
|---|---|
| `src/components/IzaComputer.jsx` | Main CRT display React component. Contains the `requestAnimationFrame` render loop, two canvas elements (`source-canvas` for compositing, `altered-canvas` for pixel-processed output), viewport size calculation (`_computeViewportMeasurements`), resize handling (`_setContainerSize`), and the auto-performance degradation logic (`isPerformantRef`). |
| `src/utils/deformers.js` | CRT pixel-effect engine. Exports `applyAllDeformers`, which chains three pixel-level passes per frame across every pixel: `_pixelizeBit` (phosphor sub-pixel simulation — `adjustmentSmall`/`adjustmentLarge` values, sub-pixel stride), `_shiftPixel` (chromatic aberration — `positionFactor`, `factor` divisor, brightness threshold), and `_glowEdgesBit` (phosphor edge glow — `distance`, `maxContrast` threshold, `increaseAmount` base, falloff ratios). Every parameter in each pass is a tunable knob. Running all three passes on every pixel at large canvas sizes is the primary performance bottleneck. |
| `src/constants/magic-numbers.js` | Central numeric constants. `ABSOLUTE_MAX_VIEWPORT_WIDTH: 1200` is the hardcoded size cap that this feature removes. `MAX_MPF: 150` and `PERFORMANCE_TEST_LENGTH: 30` govern the existing one-shot quality evaluation — these will be superseded by the continuous `TARGET_FPS` loop. |

**Key integration constraints:**
- The component uses two canvas elements in a layered composition: `source-canvas` holds the base image and text; `altered-canvas` holds the pixel-processed CRT overlay. Both must be resized together on viewport changes.
- The existing quality model is binary: `isPerformantRef` on/off = all deformers vs. `display:none`. This feature replaces it with a multi-step quality ladder backed by the individual deformer parameters.
- The displacement system in `_deform()` adds three scanline-shift bands per frame (`travelPixelsPerCycle`, band heights, and displacement offsets are all tunable). Reducing or eliminating bands is another quality knob.
- No external image processing libraries are in use; all pixel manipulation is performed via `getImageData` / `putImageData` on the 2D canvas context.

**Optimization scope**: A significant portion of implementation effort SHOULD go into optimizing the deformer pipeline itself — not just wiring up the adaptive control loop. This includes: skipping pixels at lower quality levels (stride-based sampling), disabling entire passes at lower steps, tuning parameter values to reduce visual cost per pixel, and restructuring `applyAllDeformers` to accept a quality level argument that controls which passes run and at what intensity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CRT display canvas MUST scale to the largest possible 4:3 aspect ratio rectangle that fits within the browser window, with no hardcoded maximum pixel size.
- **FR-002**: The CRT display MUST be centered within the browser window; any remaining space (letterbox/pillarbox bars) MUST be solid black.
- **FR-003**: The CRT canvas effect MUST be applied across the full display area at any canvas size.
- **FR-004**: The display MUST respond to browser window resize events and recalculate its 4:3 dimensions without a page reload; recalculation MUST be debounced with a 200ms delay so it triggers only after resizing activity has stopped, not on every intermediate event.
- **FR-005**: The CRT canvas rendering MUST implement a continuous bidirectional quality adaptation loop running for the lifetime of the session. The loop operates as follows:
  - **Target FPS**: Governed by a named constant `TARGET_FPS` (default: 30). This value is set by the user's quality preset (FR-008) and MUST NOT be hardcoded at any call site — only read from the constant.
  - **Initial state**: On each fresh evaluation start (first load or after a canvas area increase per FR-007), the quality level begins at full (all CRT effects enabled).
  - **Evaluation cycle**: Every 3 seconds, the monitor compares the measured average frame time against the `TARGET_FPS` budget. If measured FPS is below `TARGET_FPS`, reduce the quality level one step (i.e. increment `qualityLevelRef` — a higher counter value means fewer active effects). If measured FPS is above `TARGET_FPS` + `HEADROOM_FPS` (5fps), increase the quality level one step (i.e. decrement `qualityLevelRef` — a lower counter value means more active effects). "Quality level" is a multi-step integer counter (e.g. 0–N) where **0 = maximum quality** (all effects enabled) and **N = minimum quality** (fewest effects); each step maps to a specific combination of deformer pass parameters and pixel sampling rates — not a binary on/off. The step ladder design (how many steps, which passes are active at each step, which parameter values are used) is an implementation decision informed by performance testing. The evaluation itself MUST be computationally trivial — compare a recorded timestamp delta to the target budget and increment or decrement a quality counter; no expensive computation is permitted.
  - **Emergency degradation**: If any single `requestAnimationFrame` delta exceeds 3000ms (3 seconds), the system MUST immediately drop to the lowest quality level and restart the evaluation cycle without waiting for the next 3-second window.
  - **Seamless transitions**: All quality level changes MUST be seamless — no visible flash, blank frame, or layout shift.
- **FR-006**: The display MUST correctly maintain the 4:3 aspect ratio and quality level when the window is resized.
- **FR-007**: When the canvas area increases beyond the area at which the current evaluation cycle was started, the monitor MUST restart its evaluation cycle at the new canvas size. The quality level is NOT reset on resize — evaluation continues from the current quality level and adjusts up or down from there as the normal FR-005 cycle dictates. Only the evaluation window is restarted. The initial reference area on first load is 0 (zero), guaranteeing the first evaluation always runs. The reference area is updated to the current canvas area each time a new evaluation cycle begins.
- **FR-008**: The application MUST expose a quality preset selector in the settings route (cmd-settings) with three options: **High** (`TARGET_FPS` = 60), **Normal** (`TARGET_FPS` = 30, default on first launch), and **Low** (`TARGET_FPS` = 15). Each preset is a bundle of default parameter values across the deformer pipeline (pass selection, pixel sampling stride, effect intensities) that the continuous adapter uses as its starting point and goal range. The adapter still adjusts quality level up or down from that starting point based on live performance; the preset sets the FPS target that defines "good enough." Selecting a preset MUST update `TARGET_FPS` immediately AND MUST reset `qualityLevelRef` to 0 (maximum quality) so the adapter re-evaluates from full quality at the new FPS target; the change takes effect on the next FR-005 evaluation cycle. The selected preset MUST persist across sessions.

### Assumptions

- Modern browsers (released in the last 3–4 years) will be the primary target; older browser compatibility is not a requirement for this change.
- "Smooth" rendering is device-agnostic and relative to the active quality preset: the application continuously monitors its own frame performance and adjusts its quality level bidirectionally to sustain the `TARGET_FPS` budget (default: 30fps = ≤33ms per frame) on whatever hardware is present. No minimum hardware baseline is required — the continuous quality adaptation loop is the guarantee.
- The existing CRT visual effects (scanlines, phosphor glow, screen curvature, etc.) MUST be preserved at typical window sizes. At extreme display sizes (beyond standard desktop resolutions), graceful quality level reduction (e.g., reduced scanline density, simplified curvature) is acceptable as a fallback to maintain smooth rendering.
- If a hard performance ceiling exists on very large displays, the display should still function correctly (without crashing or hanging), and may reduce its quality level rather than drop frames severely.
- The 4:3 aspect ratio is fixed and applies at all window sizes.
- The canvas renders at CSS pixel resolution. Device pixel ratio (retina/HiDPI) is not accounted for; no scaling by device pixel ratio is applied.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The CRT display is the largest 4:3 rectangle fitting the browser window on initial load, verified across window shapes: widescreen, square, and portrait orientations.
- **SC-002**: After an initial settling period (≤3 seconds, measured from the first `requestAnimationFrame` callback at the current canvas dimensions), the rendering system stabilizes at or near `TARGET_FPS` (default: 30fps = ≤33ms per frame) and maintains it continuously through bidirectional quality adaptation. A dropped frame is defined as any frame whose `requestAnimationFrame` timestamp delta exceeds 2× the target frame budget (e.g., >66ms at 30fps target). If any single frame exceeds 3000ms, emergency degradation triggers immediately. The 3-second settling period is a soft expectation for typical hardware — if stabilization takes longer, the loop continues adapting and this is not a failure condition. The quality level at which `TARGET_FPS` is achieved may vary by device and preset; both upward and downward quality adjustments are expected and tested. Verified via browser DevTools Performance panel or `requestAnimationFrame` timestamp deltas.
- **SC-003**: The display correctly recalculates to the new maximum 4:3 size within 500ms of the debounce callback firing (i.e., within 500ms of the 200ms debounce delay elapsing after the last resize event), not from the moment the user stops dragging. Measurement is taken using `requestAnimationFrame` timestamp deltas from the debounce callback invocation to the first `requestAnimationFrame` callback in which the canvas element's `width` and `height` attributes already reflect the new dimensions and the first pixel-processed frame at those dimensions has been drawn — i.e., canvas resize and first draw must have completed, not merely been scheduled.
- **SC-004**: The application continues to function correctly (no crashes, errors, or broken layout) at any browser window size from 320×240 up to at least 2560×1440.
- **SC-005**: At maximum display size, all CRT visual effects (scanlines, phosphor glow, screen curvature) are visibly present and applied across the full canvas area, verified by visual inspection at 1920×1080 and 2560×1440 window sizes.
- **SC-006**: The settings route (cmd-settings) contains a quality preset selector with three options — High (60fps target), Normal (30fps target), Low (15fps target) — with Normal selected by default on first launch. Selecting a preset causes the performance adapter to use the corresponding `TARGET_FPS` value starting from the next evaluation cycle.

## Clarifications

### Session 2026-03-09

- Q: Can CRT visual effects be simplified or reduced if needed for smooth rendering at large window sizes? → A: Preserve effects by default; allow graceful quality reduction at extreme/large sizes only as a fallback.
- Q: How should the canvas fill the browser window — literal 100% viewport or constrained by aspect ratio? → A: Scale to 100% of the greatest fitting dimension while maintaining a fixed 4:3 aspect ratio; center with neutral bars for remaining space.
- Q: Should the canvas update live during a window resize drag, or only after the drag ends? → A: Debounced — update only after resize activity stops, not on every intermediate event.
- Q: Should the canvas render at native device (retina/HiDPI) resolution or CSS resolution? → A: CSS resolution only; device pixel ratio is ignored.
- Q: What color should fill the letterbox/pillarbox bars outside the 4:3 canvas? → A: Solid black — classic CRT/monitor bezel aesthetic.
- Q: What debounce delay should be used when the browser window is resized? → A: 200ms — standard practice for resize handlers; fits comfortably within the 500ms recalculation completion target in SC-003.
- Q: When the window is resized to a significantly larger size after the initial performance evaluation has already completed (`isEvaluatedRef=true`), should the auto-degradation evaluation re-run? → A: Yes — the performance evaluation MUST re-run whenever the canvas dimensions increase beyond the size at which the previous evaluation was conducted. If the new canvas area is larger than the area at last evaluation, reset `isEvaluatedRef` to false so the evaluation runs fresh at the new size. Decreasing the window size does not trigger re-evaluation (the display remains in its current quality mode).
- Q: Should the performance target be tied to a specific hardware baseline? → A: No — instead of targeting specific hardware, the application continuously monitors its own frame performance and dynamically adjusts its quality level to maintain smooth rendering on whatever device is present. Hardware specs are irrelevant; the adaptive quality system is the mechanism that enforces the performance target.
- Q: Does the quality adaptation loop support upward quality restoration, or is it one-way reduction only? → A: Bidirectional — the loop continuously adjusts quality up or down every 3 seconds based on whether measured FPS is above or below `TARGET_FPS`. If the device has headroom above the target, quality increases one step; if it falls below, quality decreases one step. One-way reduction was rejected because it prevents the display from recovering when host load decreases.
- Q: What quality level does the canvas start at on a fresh evaluation, and what happens if a single frame stalls? → A: Fresh evaluations (initial load) start at full quality level — all CRT effects fully enabled. However, if any single `requestAnimationFrame` delta exceeds 3000ms (a stall), the system immediately drops to the lowest quality level and restarts the evaluation cycle, without waiting for the next 3-second window.
- Q: When does the SC-002 "settling period" clock start, and what is the settling period duration? → A: The clock starts from the first `requestAnimationFrame` callback at the current canvas dimensions. The settling period is 3 seconds — a soft expectation for typical hardware, not a hard deadline. If stabilization takes longer, the loop continues adapting; this is not a failure.
- Q: When FR-007 triggers a new evaluation cycle on canvas area increase, is the quality level reset to full? → A: No — the quality level is NOT reset on canvas area increase. The evaluation cycle restarts (the 3-second measurement window resets) but quality continues from wherever it currently is, adjusting up or down as the normal FR-005 cycle dictates. Starting back at full quality on a larger canvas would likely cause visible stutter on constrained devices.
- Q: What is the initial seed value for the canvas area reference used in FR-007's re-evaluation comparison? → A: The initial reference area is 0 (zero). Any real canvas area will exceed 0, so the first evaluation always runs on initial load. The reference area is updated to the current canvas area each time a new evaluation cycle begins.
- Q: Is there a concept of "extended session" performance degradation that needs to be specified? → A: No — the concept was removed. The quality adaptation loop runs continuously for the entire session and self-corrects whenever host load changes. There is no "settled" state that can degrade; the loop always responds. The only requirement is that the loop itself be computationally trivial (compare a timestamp delta to a constant; adjust a counter).
- Q: What is the canonical term for the degree of CRT effect rendering applied — "effect quality", "effect fidelity", "CRT effect quality", or another synonym? → A: The canonical term is "quality level". All synonyms ("effect fidelity", "CRT effect quality", "effect quality") are deprecated in favor of "quality level" throughout this spec.
- Q: What is the default performance target FPS and how can users change it? → A: The default is 30fps (Normal preset) — smooth enough for CRT animation without unnecessary GPU/CPU load. Users can select High (60fps), Normal (30fps), or Low (15fps) presets in the settings route (cmd-settings). The preset maps directly to the `TARGET_FPS` constant used by the FR-005 adaptation loop. 60fps was considered too aggressive as a universal default; 30fps is the practical sweet spot.
- Q: Is "quality level" a binary on/off like the existing `isPerformantRef`, or a multi-dimensional system? → A: Multi-dimensional. Quality level is a step counter backed by many tunable parameters across the deformer pipeline: which passes run (`_pixelizeBit`, `_shiftPixel`, `_glowEdgesBit`), pixel sampling stride (skip every Nth pixel), effect intensities (adjustment values, thresholds, falloff ratios), and displacement band configuration. The three user presets (High/Normal/Low) are convenient bundles of these parameters; the continuous adaptation loop moves up and down the step ladder by adjusting these knobs. The existing binary on/off (`display:none` vs. full deform) is the floor and ceiling of the old system — this feature replaces it with a real ladder in between.
- Q: How much implementation effort should go into optimizing the deformer code vs. wiring the adaptive control loop? → A: A significant portion — the deformer optimization is not secondary to the control loop. The main opportunity is in `applyAllDeformers`: it currently runs all three passes on every pixel for every frame. At large canvas sizes this is the bottleneck. Optimization work includes stride-based pixel sampling, conditional pass skipping, parameter tuning per quality level, and restructuring the function to accept a quality level argument. The control loop is a lightweight wrapper around this work; the visual quality and performance gains come from the deformer improvements themselves.

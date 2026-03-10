/**
 * QUALITY_LADDER — 8-step adaptive quality ladder for the CRT deformer pipeline.
 *
 * Design rationale:
 *   - Level 0 is maximum quality (all passes enabled, stride=1, every pixel processed).
 *   - Level 7 is minimum quality (stride=4, glow/shift disabled, lowest phosphor adjustments).
 *   - The adapter steps the level up by 1 when FPS is below TARGET_FPS (reduce quality),
 *     and down by 1 when FPS exceeds TARGET_FPS + HEADROOM_FPS (improve quality).
 *   - Emergency degradation jumps directly to level 7 on any single-frame delta > STALL_THRESHOLD_MS.
 *
 * Step ordering decisions (from data-model.md):
 *   - Level 1: drops glow.useRandom first — the single most expensive per-pixel op (rngeezus
 *     pool lookup in the hot loop). Approx ~30% cost reduction.
 *   - Levels 2–3: raise glow.maxContrast (fewer edges trigger), reduce falloff multipliers
 *     and adjustmentLarge before disabling glow entirely. Preserves some phosphor halation.
 *   - Level 4: fully disables glow. shift stays active through level 5 (cheap vs glow).
 *   - Levels 4–5: reduce shift.positionFactor / raise shift.factor to lower chromatic intensity
 *     before dropping the pass entirely at level 6.
 *   - Levels 6–7: stride=4 (every 4th pixel, block-fill neighbors). adjustmentLarge/Small reduced
 *     to compensate for phosphor triads averaging out at stride-4.
 *   - displacement.bands reaches 0 at level 6 — dropped last among visual elements because it
 *     contributes strongly to CRT aesthetic, but at bands=0 the _createDisplacement call is skipped.
 *
 * Approximate CPU cost per level (estimates — measure on reference device and tune):
 *   Level 0: 100% | Level 1: ~70% | Level 2: ~55% | Level 3: ~35%
 *   Level 4: ~22% | Level 5: ~18% | Level 6: ~8%  | Level 7: ~5%
 */
export const QUALITY_LADDER = Object.freeze([
    // Level 0 — Maximum quality, all passes enabled, stride 1
    {
        stride: 1,
        glow: { enabled: true,  useRandom: true,  maxContrast: 120, distance: 3, falloff: { near: 1.0, mid: 0.5, far: 0.2 } },
        shift: { enabled: true,  positionFactor: 5, factor: 7,  brightnessThreshold: 140 },
        pixelize: { adjustmentLarge: 24, adjustmentSmall: 12 },
        displacement: { bandCount: 3, travelPixelsPerCycle: 3 },
    },
    // Level 1 — Drop glow.useRandom (biggest single win: eliminates rngeezus pool lookup per pixel)
    {
        stride: 1,
        glow: { enabled: true,  useRandom: false, maxContrast: 120, distance: 3, falloff: { near: 1.0, mid: 0.5, far: 0.2 } },
        shift: { enabled: true,  positionFactor: 5, factor: 7,  brightnessThreshold: 140 },
        pixelize: { adjustmentLarge: 24, adjustmentSmall: 12 },
        displacement: { bandCount: 3, travelPixelsPerCycle: 3 },
    },
    // Level 2 — Raise glow.maxContrast, reduce falloff, narrow displacement bands
    {
        stride: 1,
        glow: { enabled: true,  useRandom: false, maxContrast: 150, distance: 3, falloff: { near: 1.0, mid: 0.4, far: 0.15 } },
        shift: { enabled: true,  positionFactor: 5, factor: 7,  brightnessThreshold: 160 },
        pixelize: { adjustmentLarge: 22, adjustmentSmall: 12 },
        displacement: { bandCount: 2, travelPixelsPerCycle: 3 },
    },
    // Level 3 — Stride 2, further raise contrast threshold, reduce falloff and phosphor values
    {
        stride: 2,
        glow: { enabled: true,  useRandom: false, maxContrast: 180, distance: 2, falloff: { near: 0.8, mid: 0.3, far: 0.1 } },
        shift: { enabled: true,  positionFactor: 4, factor: 8,  brightnessThreshold: 180 },
        pixelize: { adjustmentLarge: 20, adjustmentSmall: 10 },
        displacement: { bandCount: 2, travelPixelsPerCycle: 3 },
    },
    // Level 4 — Disable glow entirely; shift stays active but weakened; single displacement band
    {
        stride: 2,
        glow: { enabled: false, useRandom: false, maxContrast: null, distance: null, falloff: { near: null, mid: null, far: null } },
        shift: { enabled: true,  positionFactor: 3, factor: 9,  brightnessThreshold: 200 },
        pixelize: { adjustmentLarge: 18, adjustmentSmall: 10 },
        displacement: { bandCount: 1, travelPixelsPerCycle: 2 },
    },
    // Level 5 — Glow off; shift further reduced; lowest stride-2 phosphor values
    {
        stride: 2,
        glow: { enabled: false, useRandom: false, maxContrast: null, distance: null, falloff: { near: null, mid: null, far: null } },
        shift: { enabled: true,  positionFactor: 2, factor: 10, brightnessThreshold: 220 },
        pixelize: { adjustmentLarge: 14, adjustmentSmall: 8 },
        displacement: { bandCount: 1, travelPixelsPerCycle: 2 },
    },
    // Level 6 — Stride 4; glow and shift both disabled; displacement bands=0 (loop skipped)
    {
        stride: 4,
        glow: { enabled: false, useRandom: false, maxContrast: null, distance: null, falloff: { near: null, mid: null, far: null } },
        shift: { enabled: false, positionFactor: null, factor: null, brightnessThreshold: null },
        pixelize: { adjustmentLarge: 12, adjustmentSmall: 6 },
        displacement: { bandCount: 0, travelPixelsPerCycle: null },
    },
    // Level 7 — Minimum quality; all visual passes off; stride 4; lowest phosphor values
    {
        stride: 4,
        glow: { enabled: false, useRandom: false, maxContrast: null, distance: null, falloff: { near: null, mid: null, far: null } },
        shift: { enabled: false, positionFactor: null, factor: null, brightnessThreshold: null },
        pixelize: { adjustmentLarge: 8, adjustmentSmall: 4 },
        displacement: { bandCount: 0, travelPixelsPerCycle: null },
    },
]);

export default {
    VERSION_MAJOR: 1,
    VERSION_MINOR: 4,

    // iza-computer
    FONT_SIZE: 14,
    FONT_CHARACTER_WIDTH: 8.7,
    FONT_SIZE_M: 12,
    FONT_CHARACTER_WIDTH_M: 6.9,
    FONT_SIZE_S: 9,
    FONT_CHARACTER_WIDTH_S: 5.4,
    SPACE_BETWEEN_LINES: 2,
    MIN_BORDER: 50,
    MIN_USEABLE_COLUMNS: 60,
    FRAME_RATE: 1000 / 60,
    SCREEN_BREAK: 768, // match media query max-width at app/styles/app.css

    // crt-display adaptive quality
    TARGET_FPS: 30,
    TARGET_FPS_HIGH: 60,
    TARGET_FPS_LOW: 15,
    HEADROOM_FPS: 5,
    EVAL_WINDOW_MS: 3000,
    STALL_THRESHOLD_MS: 3000,
    RESIZE_DEBOUNCE_MS: 200,
    CANVAS_ASPECT_RATIO: 4 / 3,

    // status-bar
    STATUS_FONT_SIZE: 16,
    STATUS_FONT_CHARACTER_WIDTH: 10,
    STATUS_BORDER: 75,

    // story-core
    XP_PER_MOVE: 1,
    XP_PER_UNLOCK: 2,
    XP_PER_COMPLETION_ITEM: 3,
    HOME_COORD_X: 47,
    HOME_COORD_Y: 47,
    MAX_THINGS_TO_LIST: 10,
    INIT_ROOM_ONE_INVENTORY: Object.freeze([1, 23, 25]),
    INIT_USER_INVENTORY: Object.freeze([3]),

    // input-processor-base
    CURSOR_CHAR: '█',
    COLORIZE_LINE_PREFIX: '<colorize>',
    COLORIZE_COLOR_LENGTH: 7,
    DEFAULT_PROMPT_COLOR: '#35dd59',
    STATIC_PROMPT_COLOR: '#e3ff16',
    DIRECTORY_LIST_COLOR: '#0fade1',
    EXEC_COLOR: '#86ff5e',
    INACTIVE_COLORIZED_COLOR: '#2a4959',
    INACTIVE_SCROLLED_COLOR: '#555555',
    DEFAULT_SCROLLED_COLOR: '#878787',
    DEFAULT_FEEDBACK_COLOR: '#FFFFFF',
    CURSOR_BLINK_LENGTH: 400 // in milliseconds
};

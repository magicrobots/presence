import rngeezus from './rngeezus';
import { QUALITY_LADDER } from '../constants/magic-numbers';
import type { QualityLevel, PixelizeParams, ShiftParams, GlowParams } from '../types/canvas';

// applyAllDeformers — stride loop with block-fill for skipped pixels.
//
// Design:
//   - qualityLevel selects a row from QUALITY_LADDER (0 = max quality, 7 = min quality).
//   - stride controls how many pixels are sampled vs. skipped: stride=1 processes every
//     pixel; stride=2 samples every other pixel; stride=4 samples every 4th pixel.
//   - Skipped pixels (the stride-1 neighbors following each sampled pixel) are block-filled
//     by copying the sampled pixel's RGBA values directly. This avoids leaving stale data
//     in skipped slots while keeping cost proportional to 1/stride.
//   - Drop order rationale: pixelizeBit first (cheap, always runs), then shiftPixel
//     (moderate cost, disabled at levels 6–7), then glowEdgesBit last (most expensive,
//     disabled at levels 4–7). This matches the visual priority inversion: phosphor triads
//     are cheapest to keep active, glow is most expensive.
//   - baseIdx pre-computation: `const baseIdx = i * 4` is hoisted before all three pass
//     calls to avoid redundant multiplications in each pass function.
//   - The random value for glow is hoisted once per frame (not per pixel) via
//     rngeezus.getRandomValue. The glow pass accepts it as a pre-computed argument so
//     the pool lookup does not occur in the hot loop.

/**
 * Apply phosphor triad tint pattern to a single pixel.
 * Pattern cycles every 4 pixels:
 *   i % 4 === 0 — no change
 *   i % 4 === 1 — red phosphor: boost R, reduce G and B
 *   i % 4 === 2 — blue phosphor: boost B, reduce R and G
 *   i % 4 === 3 — brightness boost: lift all channels equally
 */
export function pixelizeBit(i: number, data: Uint8ClampedArray, params: PixelizeParams, baseIdx: number): void {
    const r = data[baseIdx + 0];
    const g = data[baseIdx + 1];
    const b = data[baseIdx + 2];

    const adjustmentSmall = params.adjustmentSmall;
    const adjustmentLarge = params.adjustmentLarge;

    if (i % 4 === 1)
    {
        // red pixel
        data[baseIdx + 0] = r + adjustmentLarge;
        data[baseIdx + 1] = g - adjustmentLarge;
        data[baseIdx + 2] = b - adjustmentLarge;
    }

    if (i % 4 === 2)
    {
        // blue pixel
        data[baseIdx + 0] = r - adjustmentLarge;
        data[baseIdx + 1] = g - adjustmentLarge;
        data[baseIdx + 2] = b + adjustmentLarge;
    }

    if (i % 4 === 3)
    {
        // brighten pixel
        data[baseIdx + 0] = r + adjustmentSmall;
        data[baseIdx + 1] = g + adjustmentSmall;
        data[baseIdx + 2] = b + adjustmentSmall;
    }
}

/**
 * Apply phosphor-shift ghosting effect to a single pixel.
 * Reads the current pixel brightness and adds or subtracts a fraction of it
 * at the target position (i * positionFactor), creating a scan-line ghost trail.
 * No-ops when params.enabled is false.
 */
export function shiftPixel(i: number, data: Uint8ClampedArray, params: ShiftParams, baseIdx: number): void {
    if (!params.enabled) {
        return;
    }
    const r = data[baseIdx + 0];
    const g = data[baseIdx + 1];
    const b = data[baseIdx + 2];
    const r1 = data[i * (params.positionFactor as number) + 0];
    const g1 = data[i * (params.positionFactor as number) + 1];
    const b1 = data[i * (params.positionFactor as number) + 2];
    if (r + b + g > (params.brightnessThreshold as number)) {
        data[i * (params.positionFactor as number) + 0] = r1 + r / (params.factor as number);
        data[i * (params.positionFactor as number) + 1] = g1 + g / (params.factor as number);
        data[i * (params.positionFactor as number) + 2] = b1 + b / (params.factor as number);
    } else {
        data[i * (params.positionFactor as number) + 0] = r1 - r / (params.factor as number);
        data[i * (params.positionFactor as number) + 1] = g1 - g / (params.factor as number);
        data[i * (params.positionFactor as number) + 2] = b1 - b / (params.factor as number);
    }
}

/**
 * Apply phosphor glow blooming effect to the three pixels following a high-contrast edge.
 * When the brightness difference between the current pixel and the pixel at `distance`
 * exceeds `maxContrast`, the three successor pixels are brightened with a falloff gradient
 * (near > mid > far). An optional random value modulates the bloom intensity.
 * No-ops when params.enabled is false or contrast is below threshold.
 */
export function glowEdgesBit(i: number, data: Uint8ClampedArray, params: GlowParams, randomValue: number, baseIdx: number): void {
    if (!params.enabled) {
        return;
    }

    const r = data[baseIdx + 0];
    const g = data[baseIdx + 1];
    const b = data[baseIdx + 2];
    const r1 = data[(i + (params.distance as number)) * 4 + 0];
    const g1 = data[(i + (params.distance as number)) * 4 + 1];
    const b1 = data[(i + (params.distance as number)) * 4 + 2];

    const currBrightness = r + g + b;
    const nextBrightness = r1 + g1 + b1;
    const contrast = Math.abs(nextBrightness - currBrightness);

    if (contrast > (params.maxContrast as number))
    {
        const baseIncreaseAmount = params.useRandom ? (20 + randomValue) : 20;

        const nextPixelIndex = i + 1;
        const nextPixelR = data[nextPixelIndex * 4 + 0];
        const nextPixelG = data[nextPixelIndex * 4 + 1];
        const nextPixelB = data[nextPixelIndex * 4 + 2];
        const nearAmount = baseIncreaseAmount * (params.falloff.near as number);
        data[nextPixelIndex * 4 + 0] = nextPixelR + nearAmount;
        data[nextPixelIndex * 4 + 1] = nextPixelG + nearAmount;
        data[nextPixelIndex * 4 + 2] = nextPixelB + nearAmount;

        const middlePixelIndex = i + 2;
        const middlePixelR = data[middlePixelIndex * 4 + 0];
        const middlePixelG = data[middlePixelIndex * 4 + 1];
        const middlePixelB = data[middlePixelIndex * 4 + 2];
        const midAmount = baseIncreaseAmount * (params.falloff.mid as number);
        data[middlePixelIndex * 4 + 0] = middlePixelR + midAmount;
        data[middlePixelIndex * 4 + 1] = middlePixelG + midAmount;
        data[middlePixelIndex * 4 + 2] = middlePixelB + midAmount;

        const farPixelIndex = i + 3;
        const farPixelR = data[farPixelIndex * 4 + 0];
        const farPixelG = data[farPixelIndex * 4 + 1];
        const farPixelB = data[farPixelIndex * 4 + 2];
        const farAmount = baseIncreaseAmount * (params.falloff.far as number);
        data[farPixelIndex * 4 + 0] = farPixelR + farAmount;
        data[farPixelIndex * 4 + 1] = farPixelG + farAmount;
        data[farPixelIndex * 4 + 2] = farPixelB + farAmount;
    }
}

/**
 * Orchestrate all deformer passes over every pixel in `imageData`.
 *
 * Applies pixelizeBit → shiftPixel → glowEdgesBit at the stride, glow, shift, and
 * pixelize parameters determined by `qualityLevel`. Skipped pixels (stride > 1) are
 * block-filled from the sampled pixel to avoid stale data.
 *
 * Returns `false` if imageData is falsy; otherwise returns the mutated ImageData.
 */
export function applyAllDeformers(imageData: ImageData, qualityLevel: QualityLevel): ImageData | false {
    if (!imageData) {
        return false;
    }

    // Clamp qualityLevel to valid range [0, 7]
    const level: QualityLevel = (typeof qualityLevel === 'number' && qualityLevel >= 0 && qualityLevel <= 7)
        ? Math.floor(qualityLevel) as QualityLevel
        : 0;

    const entry = QUALITY_LADDER[level];
    const stride = entry.stride;
    const glowParams = entry.glow;
    const shiftParams = entry.shift;
    const pixelizeParams = entry.pixelize;

    // Hoist random value once per frame — passed to glowEdgesBit to avoid
    // per-pixel pool lookup inside the hot loop.
    const randomValue = rngeezus.getRandomValue('largeDisplacementPool');

    const data = imageData.data;
    const l = data.length / 4;

    for (let i = 0; i < l; i += stride) {
        const baseIdx = i * 4;
        pixelizeBit(i, data, pixelizeParams, baseIdx);
        shiftPixel(i, data, shiftParams, baseIdx);
        glowEdgesBit(i, data, glowParams, randomValue, baseIdx);

        // Block-fill: copy sampled pixel RGBA to all skipped neighbor pixels so
        // they do not retain stale data from the previous frame.
        if (stride > 1) {
            const r = data[baseIdx];
            const g = data[baseIdx + 1];
            const b = data[baseIdx + 2];
            const a = data[baseIdx + 3];
            const end = Math.min(i + stride, l);
            for (let j = i + 1; j < end; j++) {
                const jIdx = j * 4;
                data[jIdx]     = r;
                data[jIdx + 1] = g;
                data[jIdx + 2] = b;
                data[jIdx + 3] = a;
            }
        }
    }

    return imageData;
}

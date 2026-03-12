import rngeezus from './rngeezus';
import { QUALITY_LADDER } from '../constants/magic-numbers';

// applyAllDeformers — stride loop with block-fill for skipped pixels.
//
// Design:
//   - qualityLevel selects a row from QUALITY_LADDER (0 = max quality, 7 = min quality).
//   - stride controls how many pixels are sampled vs. skipped: stride=1 processes every
//     pixel; stride=2 samples every other pixel; stride=4 samples every 4th pixel.
//   - Skipped pixels (the stride-1 neighbors following each sampled pixel) are block-filled
//     by copying the sampled pixel's RGBA values directly. This avoids leaving stale data
//     in skipped slots while keeping cost proportional to 1/stride.
//   - Drop order rationale: _pixelizeBit first (cheap, always runs), then _shiftPixel
//     (moderate cost, disabled at levels 6–7), then _glowEdgesBit last (most expensive,
//     disabled at levels 4–7). This matches the visual priority inversion: phosphor triads
//     are cheapest to keep active, glow is most expensive.
//   - baseIdx pre-computation: `const baseIdx = i * 4` is hoisted before all three pass
//     calls to avoid redundant multiplications in each pass function.
//   - The random value for glow is hoisted once per frame (not per pixel) via
//     rngeezus.getRandomValue. The glow pass accepts it as a pre-computed argument so
//     the pool lookup does not occur in the hot loop.
export function applyAllDeformers(imageData, qualityLevel) {
    if (!imageData) {
        return false;
    }

    // Clamp qualityLevel to valid range [0, 7]
    const level = (typeof qualityLevel === 'number' && qualityLevel >= 0 && qualityLevel <= 7)
        ? Math.floor(qualityLevel)
        : 0;

    const entry = QUALITY_LADDER[level];
    const stride = entry.stride;
    const glowParams = entry.glow;
    const shiftParams = entry.shift;
    const pixelizeParams = entry.pixelize;

    // Hoist random value once per frame — passed to _glowEdgesBit to avoid
    // per-pixel pool lookup inside the hot loop.
    const randomValue = rngeezus.getRandomValue('largeDisplacementPool');

    const l = imageData.data.length / 4;

    for (let i = 0; i < l; i += stride) {
        const baseIdx = i * 4;
        _pixelizeBit(i, imageData, pixelizeParams, baseIdx);
        _shiftPixel(i, imageData, shiftParams, baseIdx);
        _glowEdgesBit(i, imageData, glowParams, randomValue, baseIdx);

        // Block-fill: copy sampled pixel RGBA to all skipped neighbor pixels so
        // they do not retain stale data from the previous frame.
        if (stride > 1) {
            const r = imageData.data[baseIdx];
            const g = imageData.data[baseIdx + 1];
            const b = imageData.data[baseIdx + 2];
            const a = imageData.data[baseIdx + 3];
            const end = Math.min(i + stride, l);
            for (let j = i + 1; j < end; j++) {
                const jIdx = j * 4;
                imageData.data[jIdx]     = r;
                imageData.data[jIdx + 1] = g;
                imageData.data[jIdx + 2] = b;
                imageData.data[jIdx + 3] = a;
            }
        }
    }

    return imageData;
}

function _shiftPixel(i, imageData, params, baseIdx) {
    if (!params.enabled) {
        return;
    }
    let r = imageData.data[baseIdx + 0];
    let g = imageData.data[baseIdx + 1];
    let b = imageData.data[baseIdx + 2];
    let r1 = imageData.data[i * params.positionFactor + 0];
    let g1 = imageData.data[i * params.positionFactor + 1];
    let b1 = imageData.data[i * params.positionFactor + 2];
    if (r + b + g > params.brightnessThreshold) {
        imageData.data[i * params.positionFactor + 0] = r1 + r / params.factor;
        imageData.data[i * params.positionFactor + 1] = g1 + g / params.factor;
        imageData.data[i * params.positionFactor + 2] = b1 + b / params.factor;
    } else {
        imageData.data[i * params.positionFactor + 0] = r1 - r / params.factor;
        imageData.data[i * params.positionFactor + 1] = g1 - g / params.factor;
        imageData.data[i * params.positionFactor + 2] = b1 - b / params.factor;
    }
}

function _pixelizeBit(i, imageData, params, baseIdx) {
    let r = imageData.data[baseIdx + 0];
    let g = imageData.data[baseIdx + 1];
    let b = imageData.data[baseIdx + 2];

    const adjustmentSmall = params.adjustmentSmall;
    const adjustmentLarge = params.adjustmentLarge;

    if (i % 4 === 1)
    {
        // red pixel
        imageData.data[baseIdx + 0] = r + adjustmentLarge;
        imageData.data[baseIdx + 1] = g - adjustmentLarge;
        imageData.data[baseIdx + 2] = b - adjustmentLarge;
    }

    if (i % 4 === 2)
    {
        // blue pixel
        imageData.data[baseIdx + 0] = r - adjustmentLarge;
        imageData.data[baseIdx + 1] = g - adjustmentLarge;
        imageData.data[baseIdx + 2] = b + adjustmentLarge;
    }

    if (i % 4 === 3)
    {
        // brighten pixel
        imageData.data[baseIdx + 0] = r + adjustmentSmall;
        imageData.data[baseIdx + 1] = g + adjustmentSmall;
        imageData.data[baseIdx + 2] = b + adjustmentSmall;
    }
}

function _glowEdgesBit(i, imageData, params, randomValue, baseIdx) {
    if (!params.enabled) {
        return;
    }

    let r = imageData.data[baseIdx + 0];
    let g = imageData.data[baseIdx + 1];
    let b = imageData.data[baseIdx + 2];
    let r1 = imageData.data[(i + params.distance) * 4 + 0];
    let g1 = imageData.data[(i + params.distance) * 4 + 1];
    let b1 = imageData.data[(i + params.distance) * 4 + 2];

    const currBrightness = r + g + b;
    const nextBrightness = r1 + g1 + b1;
    const contrast = Math.abs(nextBrightness - currBrightness);

    if (contrast > params.maxContrast)
    {
        const baseIncreaseAmount = params.useRandom ? (20 + randomValue) : 20;

        const nextPixelIndex = i + 1;
        const nextPixelR = imageData.data[nextPixelIndex * 4 + 0];
        const nextPixelG = imageData.data[nextPixelIndex * 4 + 1];
        const nextPixelB = imageData.data[nextPixelIndex * 4 + 2];
        const nearAmount = baseIncreaseAmount * params.falloff.near;
        imageData.data[nextPixelIndex * 4 + 0] = nextPixelR + nearAmount;
        imageData.data[nextPixelIndex * 4 + 1] = nextPixelG + nearAmount;
        imageData.data[nextPixelIndex * 4 + 2] = nextPixelB + nearAmount;

        const middlePixelIndex = i + 2;
        const middlePixelR = imageData.data[middlePixelIndex * 4 + 0];
        const middlePixelG = imageData.data[middlePixelIndex * 4 + 1];
        const middlePixelB = imageData.data[middlePixelIndex * 4 + 2];
        const midAmount = baseIncreaseAmount * params.falloff.mid;
        imageData.data[middlePixelIndex * 4 + 0] = middlePixelR + midAmount;
        imageData.data[middlePixelIndex * 4 + 1] = middlePixelG + midAmount;
        imageData.data[middlePixelIndex * 4 + 2] = middlePixelB + midAmount;

        const farPixelIndex = i + 3;
        const farPixelR = imageData.data[farPixelIndex * 4 + 0];
        const farPixelG = imageData.data[farPixelIndex * 4 + 1];
        const farPixelB = imageData.data[farPixelIndex * 4 + 2];
        const farAmount = baseIncreaseAmount * params.falloff.far;
        imageData.data[farPixelIndex * 4 + 0] = farPixelR + farAmount;
        imageData.data[farPixelIndex * 4 + 1] = farPixelG + farAmount;
        imageData.data[farPixelIndex * 4 + 2] = farPixelB + farAmount;
    }
}

// Named exports for unit testing (FR-026).
// The public contract (contracts/module-contracts.md §deformers) takes a raw Uint8ClampedArray
// rather than a full ImageData object. These adapter exports match the target TypeScript
// signatures so tests can be written now (TDD) before T043 converts this file to .ts.
//
// T043 will inline these into proper TypeScript function declarations.

/** @param {number} i @param {Uint8ClampedArray} data @param {import('../types/canvas').PixelizeParams} params @param {number} baseIdx */
export function pixelizeBit(i, data, params, baseIdx) {
    const mockImageData = { data };
    _pixelizeBit(i, mockImageData, params, baseIdx);
}

/** @param {number} i @param {Uint8ClampedArray} data @param {import('../types/canvas').ShiftParams} params @param {number} baseIdx */
export function shiftPixel(i, data, params, baseIdx) {
    const mockImageData = { data };
    _shiftPixel(i, mockImageData, params, baseIdx);
}

/** @param {number} i @param {Uint8ClampedArray} data @param {import('../types/canvas').GlowParams} params @param {number} randomValue @param {number} baseIdx */
export function glowEdgesBit(i, data, params, randomValue, baseIdx) {
    const mockImageData = { data };
    _glowEdgesBit(i, mockImageData, params, randomValue, baseIdx);
}

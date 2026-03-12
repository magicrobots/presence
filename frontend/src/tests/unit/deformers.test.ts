/**
 * Unit tests for deformer pixel-processing functions (FR-026).
 *
 * Tests are written against the public contract defined in
 * contracts/module-contracts.md §deformers — specifically the three named
 * pass functions:
 *   - pixelizeBit(i, data, params, baseIdx): void
 *   - shiftPixel(i, data, params, baseIdx): void
 *   - glowEdgesBit(i, data, params, randomValue, baseIdx): void
 *
 * These tests must be written BEFORE T043 refactors deformers.js → deformers.ts
 * so they serve as the correctness contract during refactoring.
 *
 * The tests import from the future module path. They will fail until T043 creates
 * the typed exports — which is the intended TDD workflow.
 */

import { describe, it, expect } from 'vitest';
import {
  pixelizeBit,
  shiftPixel,
  glowEdgesBit,
} from '../../utils/deformers';
import type { PixelizeParams, ShiftParams, GlowParams } from '../../types/canvas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a Uint8ClampedArray filled with a repeating RGBA pattern. */
function makeData(pixelCount: number, fillR = 100, fillG = 100, fillB = 100, fillA = 255): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    data[i * 4 + 0] = fillR;
    data[i * 4 + 1] = fillG;
    data[i * 4 + 2] = fillB;
    data[i * 4 + 3] = fillA;
  }
  return data;
}

// ---------------------------------------------------------------------------
// pixelizeBit
// ---------------------------------------------------------------------------

describe('pixelizeBit', () => {
  const params: PixelizeParams = { adjustmentLarge: 24, adjustmentSmall: 12 };

  it('does not modify pixels at index i % 4 === 0', () => {
    const data = makeData(8, 100, 100, 100);
    // i=0: i % 4 === 0, no modification expected
    const i = 0;
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 0]).toBe(100); // R unchanged
    expect(data[baseIdx + 1]).toBe(100); // G unchanged
    expect(data[baseIdx + 2]).toBe(100); // B unchanged
  });

  it('applies red phosphor tint at i % 4 === 1 (boosts R, reduces G and B)', () => {
    const data = makeData(8, 100, 100, 100);
    const i = 1; // i % 4 === 1 → red pixel
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 0]).toBe(100 + 24); // R += adjustmentLarge
    expect(data[baseIdx + 1]).toBe(100 - 24); // G -= adjustmentLarge
    expect(data[baseIdx + 2]).toBe(100 - 24); // B -= adjustmentLarge
  });

  it('applies blue phosphor tint at i % 4 === 2 (reduces R and G, boosts B)', () => {
    const data = makeData(8, 100, 100, 100);
    const i = 2; // i % 4 === 2 → blue pixel
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 0]).toBe(100 - 24); // R -= adjustmentLarge
    expect(data[baseIdx + 1]).toBe(100 - 24); // G -= adjustmentLarge
    expect(data[baseIdx + 2]).toBe(100 + 24); // B += adjustmentLarge
  });

  it('applies brightness boost at i % 4 === 3 (boosts R, G, B equally by adjustmentSmall)', () => {
    const data = makeData(8, 100, 100, 100);
    const i = 3; // i % 4 === 3 → brighten pixel
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 0]).toBe(100 + 12); // R += adjustmentSmall
    expect(data[baseIdx + 1]).toBe(100 + 12); // G += adjustmentSmall
    expect(data[baseIdx + 2]).toBe(100 + 12); // B += adjustmentSmall
  });

  it('clamps at Uint8ClampedArray max (255) for red boost on near-white pixel', () => {
    // Red channel = 240, adjustmentLarge = 24 → would overflow to 264, clamped to 255
    const data = makeData(8, 240, 100, 100);
    const i = 1; // red phosphor
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 0]).toBe(255); // Uint8ClampedArray clamps to 255
    expect(data[baseIdx + 1]).toBe(76);  // 100 - 24
    expect(data[baseIdx + 2]).toBe(76);  // 100 - 24
  });

  it('clamps at Uint8ClampedArray min (0) for G and B reduction on dark pixel', () => {
    // G = B = 10, adjustmentLarge = 24 → would underflow to -14, clamped to 0
    const data = makeData(8, 100, 10, 10);
    const i = 1; // red phosphor
    const baseIdx = i * 4;
    pixelizeBit(i, data, params, baseIdx);
    expect(data[baseIdx + 1]).toBe(0); // G clamped to 0
    expect(data[baseIdx + 2]).toBe(0); // B clamped to 0
  });

  it('uses adjustmentLarge and adjustmentSmall from params (different values)', () => {
    const customParams: PixelizeParams = { adjustmentLarge: 10, adjustmentSmall: 5 };
    const data = makeData(8, 100, 100, 100);

    // Test red tint with custom params
    pixelizeBit(1, data, customParams, 4);
    expect(data[4 + 0]).toBe(110); // R += 10
    expect(data[4 + 1]).toBe(90);  // G -= 10
    expect(data[4 + 2]).toBe(90);  // B -= 10

    // Test brighten with custom params
    const data2 = makeData(8, 100, 100, 100);
    pixelizeBit(3, data2, customParams, 12);
    expect(data2[12 + 0]).toBe(105); // R += 5
    expect(data2[12 + 1]).toBe(105); // G += 5
    expect(data2[12 + 2]).toBe(105); // B += 5
  });

  it('applies pattern correctly across a stride-aligned block (i=4,5,6,7)', () => {
    const data = makeData(8, 128, 128, 128);
    // i=4: i % 4 === 0 → no change
    pixelizeBit(4, data, params, 16);
    expect(data[16]).toBe(128);
    // i=5: i % 4 === 1 → red
    pixelizeBit(5, data, params, 20);
    expect(data[20]).toBe(128 + 24);
    // i=6: i % 4 === 2 → blue
    pixelizeBit(6, data, params, 24);
    expect(data[26]).toBe(128 + 24); // B channel at offset 2
    // i=7: i % 4 === 3 → brighten
    pixelizeBit(7, data, params, 28);
    expect(data[28]).toBe(128 + 12);
  });
});

// ---------------------------------------------------------------------------
// shiftPixel
// ---------------------------------------------------------------------------

describe('shiftPixel', () => {
  const enabledParams: ShiftParams = {
    enabled: true,
    positionFactor: 5,
    factor: 7,
    brightnessThreshold: 140,
  };

  it('does nothing when params.enabled is false', () => {
    const disabledParams: ShiftParams = {
      enabled: false,
      positionFactor: null,
      factor: null,
      brightnessThreshold: null,
    };
    const data = makeData(20, 100, 100, 100);
    const snapshot = Uint8ClampedArray.from(data);
    shiftPixel(0, data, disabledParams, 0);
    expect(data).toEqual(snapshot);
  });

  it('applies positive shift (adds fraction) when pixel is above brightness threshold', () => {
    // R+G+B = 200 > threshold 140 → positive shift path
    const data = makeData(20, 100, 50, 50); // R+G+B = 200 at pixel 0
    // positionFactor=5, so writes to pixel 0 (i=0 → i*positionFactor*4=0)
    // Ensure target position exists and is non-zero so delta is measurable
    // Let's set pixel at index 0 explicitly and verify shift-write behavior
    // At i=0: target slot = 0*5=0 → same position; reads and writes to same location
    // That's valid — the self-modify case.
    const r1Before = data[0];
    const g1Before = data[1];
    const b1Before = data[2];
    shiftPixel(0, data, enabledParams, 0);
    // r + r/factor = 100 + 100/7 ≈ 114.28 → Uint8ClampedArray floors to 114
    expect(data[0]).toBeGreaterThan(r1Before);
    expect(data[1]).toBeGreaterThan(g1Before);
    expect(data[2]).toBeGreaterThan(b1Before);
  });

  it('applies negative shift (subtracts fraction) when pixel is below brightness threshold', () => {
    // R+G+B = 30 < threshold 140 → negative shift path
    // i=2, positionFactor=5 → target flat byte offset = 2*5 = 10 (bytes 10, 11, 12)
    const data = makeData(20, 10, 10, 10); // R+G+B = 30 at pixel 0
    // Set target bytes 10, 11, 12 to known value
    data[10] = 80; data[11] = 80; data[12] = 80;
    shiftPixel(2, data, enabledParams, 8); // baseIdx=8 (pixel 2)
    // Expects: data[10] = 80 - 10/7 ≈ 78.57 → Uint8ClampedArray truncates → 78
    expect(data[10]).toBeLessThan(80);
    expect(data[11]).toBeLessThan(80);
    expect(data[12]).toBeLessThan(80);
  });

  it('uses positionFactor to determine the target flat byte offset', () => {
    const params: ShiftParams = { enabled: true, positionFactor: 8, factor: 4, brightnessThreshold: 50 };
    // i=1, positionFactor=8 → target flat byte offset = 1*8 = 8 (byte index 8)
    // R+G+B = 60+60+60 = 180 > 50 → positive shift
    const data = makeData(20, 60, 60, 60);
    const targetBefore = data[8]; // byte offset 8
    shiftPixel(1, data, params, 4);
    // data[8] = 60 + 60/4 = 75 (Uint8ClampedArray truncates to integer via floor)
    expect(data[8]).toBeGreaterThan(targetBefore);
    expect(data[8]).toBe(75); // 60 + floor(60/4) = 60 + 15 = 75
  });
});

// ---------------------------------------------------------------------------
// glowEdgesBit
// ---------------------------------------------------------------------------

describe('glowEdgesBit', () => {
  const enabledParams: GlowParams = {
    enabled: true,
    useRandom: false,
    maxContrast: 120,
    distance: 3,
    falloff: { near: 1.0, mid: 0.5, far: 0.2 },
  };

  it('does nothing when params.enabled is false', () => {
    const disabledParams: GlowParams = {
      enabled: false,
      useRandom: false,
      maxContrast: null,
      distance: null,
      falloff: { near: null, mid: null, far: null },
    };
    const data = makeData(20, 100, 100, 100);
    const snapshot = Uint8ClampedArray.from(data);
    glowEdgesBit(0, data, disabledParams, 0, 0);
    expect(data).toEqual(snapshot);
  });

  it('does nothing when contrast is below maxContrast threshold', () => {
    // Pixel 0 and pixel at (0+distance=3) have similar brightness → low contrast
    const data = makeData(20, 100, 100, 100); // all same → contrast = 0
    const snapshot = Uint8ClampedArray.from(data);
    glowEdgesBit(0, data, enabledParams, 0, 0);
    expect(data).toEqual(snapshot);
  });

  it('brightens next 3 pixels when contrast exceeds maxContrast', () => {
    // Pixel 0: dark (R+G+B = 0), pixel at distance 3: bright (R+G+B = 255*3)
    // contrast = |765 - 0| = 765 > maxContrast 120 → glow triggered
    const data = makeData(20, 0, 0, 0); // all dark
    // Set pixel 3 (distance offset) to bright
    data[3 * 4 + 0] = 255; data[3 * 4 + 1] = 255; data[3 * 4 + 2] = 255;

    // Pixels 1, 2, 3 (next, middle, far from pixel 0) should get brightened
    const pixel1RBefore = data[1 * 4 + 0]; // 0
    const pixel2RBefore = data[2 * 4 + 0]; // 0
    // pixel 3 already set to 255 as the "neighbor" so we'll check 1 and 2
    glowEdgesBit(0, data, enabledParams, 0, 0);

    // baseIncreaseAmount = 20 (useRandom=false, randomValue=0)
    // nearAmount = 20 * 1.0 = 20
    // midAmount  = 20 * 0.5 = 10
    // farAmount  = 20 * 0.2 = 4
    expect(data[1 * 4 + 0]).toBe(pixel1RBefore + 20); // near: +20
    expect(data[1 * 4 + 1]).toBe(0 + 20);
    expect(data[1 * 4 + 2]).toBe(0 + 20);

    expect(data[2 * 4 + 0]).toBe(pixel2RBefore + 10); // mid: +10
  });

  it('applies randomValue when useRandom is true', () => {
    const randomParams: GlowParams = {
      ...enabledParams,
      useRandom: true,
    };
    const data = makeData(20, 0, 0, 0);
    data[3 * 4 + 0] = 255; data[3 * 4 + 1] = 255; data[3 * 4 + 2] = 255;

    const randomValue = 30;
    glowEdgesBit(0, data, randomParams, randomValue, 0);

    // baseIncreaseAmount = 20 + 30 = 50
    // nearAmount = 50 * 1.0 = 50
    expect(data[1 * 4 + 0]).toBe(50);
  });

  it('applies zero increase (no glow written) when randomValue=0 and useRandom=false and base is 20', () => {
    // Sanity: useRandom=false, randomValue=0 still adds base 20
    const data = makeData(20, 0, 0, 0);
    data[3 * 4 + 0] = 255; data[3 * 4 + 1] = 255; data[3 * 4 + 2] = 255;
    glowEdgesBit(0, data, enabledParams, 0, 0);
    expect(data[1 * 4 + 0]).toBe(20); // base = 20, near = 1.0
  });

  it('respects maxContrast boundary — glow fires at exactly maxContrast+1 but not at maxContrast', () => {
    const params: GlowParams = {
      enabled: true,
      useRandom: false,
      maxContrast: 100,
      distance: 1,
      falloff: { near: 1.0, mid: 0.5, far: 0.2 },
    };

    // Case 1: contrast = 100 → NOT above threshold (strict >) → no change to near pixel
    // Pixel 0: R=50, G=0, B=0 → brightness=50
    // Pixel 1 (distance=1): R=100, G=50, B=0 → brightness=150
    // contrast = |150 - 50| = 100 → NOT > 100
    const data1 = makeData(10, 50, 0, 0);
    data1[1 * 4 + 0] = 100; data1[1 * 4 + 1] = 50; data1[1 * 4 + 2] = 0;
    const nearBefore1 = data1[1 * 4 + 0]; // near pixel is i+1 = 1; currently 100
    glowEdgesBit(0, data1, params, 0, 0);
    expect(data1[1 * 4 + 0]).toBe(nearBefore1); // no change — contrast not exceeded

    // Case 2: contrast = 101 → above threshold → glow fires on near pixel (i+1=1)
    // Pixel 0: R=50, G=0, B=0 → brightness=50
    // Pixel 1 (distance=1): R=101, G=50, B=0 → brightness=151
    // contrast = |151 - 50| = 101 > 100 → glow fires
    const data2 = makeData(10, 50, 0, 0);
    data2[1 * 4 + 0] = 101; data2[1 * 4 + 1] = 50; data2[1 * 4 + 2] = 0;
    const nearBefore2 = data2[1 * 4 + 0]; // near pixel R = 101
    glowEdgesBit(0, data2, params, 0, 0);
    // near amount = 20 * 1.0 = 20; pixel 1 R was 101 → 121
    expect(data2[1 * 4 + 0]).toBe(nearBefore2 + 20);
  });

  it('uses distance param to find the comparison pixel', () => {
    const params: GlowParams = {
      enabled: true,
      useRandom: false,
      maxContrast: 50,
      distance: 5, // compare with pixel i+5
      falloff: { near: 1.0, mid: 0.5, far: 0.2 },
    };
    const data = makeData(20, 0, 0, 0);
    // Pixel at distance=5 from pixel 0 → pixel 5 → bright
    data[5 * 4 + 0] = 200; data[5 * 4 + 1] = 200; data[5 * 4 + 2] = 200;
    // contrast = |600 - 0| = 600 > 50 → glow fires
    glowEdgesBit(0, data, params, 0, 0);
    expect(data[1 * 4 + 0]).toBe(20); // near pixel brightened
  });
});

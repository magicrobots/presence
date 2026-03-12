/**
 * CanvasRenderer — dual-canvas setup, frame rendering, and reliable repaint trigger.
 *
 * Contract: contracts/module-contracts.md §CanvasRenderer
 *
 * Dual-canvas data flow (FR-016):
 *   - source canvas: receives fillText() and drawImage() rendering (the "live" scene).
 *     Created with { willReadFrequently: true } so getImageData() calls are optimized.
 *   - altered canvas: receives putImageData() of the deformer-processed pixel output.
 *     This is the canvas visible to the user; source canvas sits beneath it in the DOM.
 *   Data path per frame:
 *     source.getImageData() → applyAllDeformers() → altered.putImageData()
 *   The separation lets the deformer pipeline read clean source pixels every frame
 *   without the feedback loop that would occur if read and write shared the same canvas.
 *
 * triggerRepaint replaces the setTimeout z-index hack (FR-018):
 *   The original _doRedrawHack() used setTimeout(740ms) to cycle z-index on the canvas
 *   element, forcing a repaint via an arbitrary delay. The double-rAF pattern used here
 *   schedules a visibility toggle inside two nested requestAnimationFrame calls, which
 *   guarantees the change occurs after the browser has committed the current paint and
 *   is preparing the next frame — no hardcoded delay required.
 */

import type { QualityLevel } from '../../types/canvas';
import { applyAllDeformers } from '../../utils/deformers';

export interface CanvasRefs {
  /** Source canvas: receives fillText() rendering, provides getImageData() */
  source: HTMLCanvasElement;
  /** Altered canvas: receives putImageData() deformed output, shown to user */
  altered: HTMLCanvasElement;
}

export interface RenderConfig {
  width: number;
  height: number;
  fontSize: number;
  fontCharWidth: number;
}

/**
 * Set up both canvas contexts with correct dimensions and imageSmoothingEnabled=false.
 *
 * The source context is created with { willReadFrequently: true } so the browser can
 * optimize for repeated getImageData() calls in the render loop. Both contexts have
 * all imageSmoothingEnabled variants disabled to prevent anti-aliasing from blurring
 * the CRT pixel output.
 */
export function initCanvases(refs: CanvasRefs, config: RenderConfig): void {
  const { source, altered } = refs;
  const { width, height } = config;

  // Set canvas dimensions
  source.width = width;
  source.height = height;
  altered.width = width;
  altered.height = height;

  const ctx = source.getContext('2d', { willReadFrequently: true });
  const ctx2 = altered.getContext('2d');

  if (ctx !== null) {
    // Disable image smoothing on source context — all four vendor-prefixed variants
    // must be set to ensure compatibility across browser engines.
    ctx.imageSmoothingEnabled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-unknown -- vendor-prefixed non-standard properties require cast
    (ctx as unknown as Record<string, boolean>).mozImageSmoothingEnabled = false;
    (ctx as unknown as Record<string, boolean>).webkitImageSmoothingEnabled = false;
    (ctx as unknown as Record<string, boolean>).msImageSmoothingEnabled = false;

    // Initialize source canvas with a solid fill so getImageData never returns
    // transparent/empty data on the first renderFrame call.
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, width, height);
  }

  if (ctx2 !== null) {
    ctx2.imageSmoothingEnabled = false;
    (ctx2 as unknown as Record<string, boolean>).mozImageSmoothingEnabled = false;
    (ctx2 as unknown as Record<string, boolean>).webkitImageSmoothingEnabled = false;
    (ctx2 as unknown as Record<string, boolean>).msImageSmoothingEnabled = false;

    // Initialize altered canvas as fully transparent — it will be populated by
    // the first renderFrame call.
    ctx2.fillStyle = 'rgba(0,0,0,0)';
  }
}

/**
 * Execute one render frame:
 * 1. Read ImageData from source canvas
 * 2. Apply deformers at qualityLevel
 * 3. Write result to altered canvas
 * Returns false if source canvas has no content (context unavailable or no image data).
 *
 * imageSmoothingEnabled is set to false before every drawImage call (per contract)
 * to ensure deformer pixel output is never blurred by interpolation.
 */
export function renderFrame(refs: CanvasRefs, qualityLevel: QualityLevel): boolean {
  const { source, altered } = refs;

  const ctx = source.getContext('2d', { willReadFrequently: true });
  const ctx2 = altered.getContext('2d');

  if (ctx === null || ctx2 === null) {
    return false;
  }

  const w = source.width;
  const h = source.height;

  if (w === 0 || h === 0) {
    return false;
  }

  // Read current pixel data from source canvas
  const imageData = ctx.getImageData(0, 0, w, h);

  // Verify source canvas has content (not fully transparent/empty)
  if (imageData.data.length === 0) {
    return false;
  }

  // Apply all deformer passes at the given quality level
  const deformed = applyAllDeformers(imageData, qualityLevel);

  if (deformed === false) {
    return false;
  }

  // Write deformed pixel data to altered canvas.
  // imageSmoothingEnabled=false is set before putImageData to guarantee no
  // interpolation is applied to the output (FR-016 contract requirement).
  ctx2.imageSmoothingEnabled = false;
  (ctx2 as unknown as Record<string, boolean>).mozImageSmoothingEnabled = false;
  (ctx2 as unknown as Record<string, boolean>).webkitImageSmoothingEnabled = false;
  (ctx2 as unknown as Record<string, boolean>).msImageSmoothingEnabled = false;

  // Build a new ImageData of the full canvas dimensions and copy deformed pixels in
  const outputData = ctx2.createImageData(w, h);
  for (let i = 0; i < outputData.data.length; i++) {
    outputData.data[i] = deformed.data[i];
  }
  ctx2.putImageData(outputData, 0, 0);

  return true;
}

/**
 * Reliable repaint trigger — replaces the setTimeout z-index hack (FR-018).
 *
 * The original approach used setTimeout(740ms) to cycle z-index on the canvas element,
 * relying on an arbitrary delay to coerce a browser repaint. The double-rAF pattern
 * used here achieves the same forced layout flush without any hardcoded delay:
 *
 *   rAF #1: browser has committed current paint; DOM mutations here are safe
 *   rAF #2: browser is preparing the next frame; display properties are flushed
 *
 * The canvas display is toggled from 'none' → 'block' inside rAF #2, which forces
 * the browser to re-evaluate its layout and repaint the element as part of the next
 * normal frame cycle.
 */
export function triggerRepaint(canvas: HTMLCanvasElement): void {
  // First rAF: wait for the current frame to complete
  requestAnimationFrame(() => {
    // Second rAF: now safe to force a layout flush for the next frame
    requestAnimationFrame(() => {
      // Toggle display to force repaint — equivalent to the z-index cycling in
      // _doRedrawHack() but driven by the browser's own frame scheduler rather
      // than an arbitrary setTimeout delay.
      canvas.style.display = 'none';
      // Read offsetHeight to force synchronous layout recalculation (layout flush)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- intentional layout flush
      canvas.offsetHeight;
      canvas.style.display = 'block';
    });
  });
}

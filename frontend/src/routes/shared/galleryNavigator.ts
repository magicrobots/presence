/**
 * Route-layer gallery types and shared navigation utility.
 *
 * These types describe the image shapes used by gallery-based route commands
 * (CmdViewer, CmdShop) and their shared navigation utility. They are defined
 * here — not in canvas.ts or terminal.ts — because they belong to the
 * route/presentation layer.
 *
 * createGalleryEnvironment builds an AppEnvironment whose keyOverrides handle
 * ARROWLEFT/ARROWRIGHT with wrapping index logic, shared by both CmdViewer and
 * CmdShop (US2 deduplication).
 */

import type { AppEnvironment } from '../../types/terminal';

export interface GalleryImage {
  path: string;
}

export interface ShopImage extends GalleryImage {
  itemMapId: number;
}

export interface GalleryConfig<T extends GalleryImage> {
  images: readonly T[];
  getImagePath: (item: T, index: number) => string;
  initialResponse: string[];
  additionalCommands?: Record<string, () => string[]>;
}

/**
 * Build an AppEnvironment for a gallery-style route command.
 *
 * The returned environment includes:
 *  - response set to config.initialResponse
 *  - keyOverrides for ARROWLEFT / ARROWRIGHT with wrapping index logic
 *  - overrideScope populated from config.additionalCommands (may be empty)
 *
 * The caller is responsible for calling setBgImage with the initial image path
 * after invoking setAppEnvironment — this mirrors the CmdViewer / CmdShop pattern.
 */
export function createGalleryEnvironment<T extends GalleryImage>(
  config: GalleryConfig<T>
): AppEnvironment {
  const { images, getImagePath, initialResponse, additionalCommands } = config;

  // Mutable index shared across the closure — intentionally not React state
  // because it does not need to trigger re-renders (same pattern as CmdViewer).
  let currentIndex = 0;

  const keyOverrides: Record<string, () => void> = {
    ARROWLEFT: () => {
      currentIndex = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
      getImagePath(images[currentIndex], currentIndex);
    },
    ARROWRIGHT: () => {
      currentIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
      getImagePath(images[currentIndex], currentIndex);
    },
  };

  const overrideScope: Record<string, unknown> = { ...(additionalCommands ?? {}) };

  return {
    activeAppName: 'gallery',
    response: [...initialResponse],
    keyOverrides,
    overrideScope,
  };
}

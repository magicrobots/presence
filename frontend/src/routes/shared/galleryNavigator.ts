/**
 * Route-layer gallery types.
 *
 * These types describe the image shapes used by gallery-based route commands
 * (CmdViewer, CmdShop) and their shared navigation utility. They are defined
 * here — not in canvas.ts or terminal.ts — because they belong to the
 * route/presentation layer.
 */

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

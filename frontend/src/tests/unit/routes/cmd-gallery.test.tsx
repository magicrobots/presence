import { describe, it, expect, vi } from 'vitest';
import {
    createGalleryEnvironment,
    type GalleryImage,
    type ShopImage,
    type GalleryConfig,
} from '../../../routes/shared/galleryNavigator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeImages(count: number): GalleryImage[] {
    return Array.from({ length: count }, (_, i) => ({ path: `img${i}.jpg` }));
}

function makeConfig(
    images: GalleryImage[],
    overrides: Partial<GalleryConfig<GalleryImage>> = {}
): GalleryConfig<GalleryImage> {
    return {
        images,
        getImagePath: (item) => `stills/${item.path}`,
        initialResponse: ['Welcome to gallery', 'ESC to quit'],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// createGalleryEnvironment — return shape
// ---------------------------------------------------------------------------

describe('createGalleryEnvironment', () => {
    describe('return shape', () => {
        it('returns an AppEnvironment with initialResponse as response', () => {
            const images = makeImages(3);
            const config = makeConfig(images);
            const env = createGalleryEnvironment(config);

            expect(env.response).toEqual(['Welcome to gallery', 'ESC to quit']);
        });

        it('sets keyOverrides with ARROWLEFT and ARROWRIGHT handlers', () => {
            const images = makeImages(3);
            const config = makeConfig(images);
            const env = createGalleryEnvironment(config);

            expect(env.keyOverrides).toBeDefined();
            expect(typeof env.keyOverrides!['ARROWLEFT']).toBe('function');
            expect(typeof env.keyOverrides!['ARROWRIGHT']).toBe('function');
        });
    });

    // ---------------------------------------------------------------------------
    // ARROWRIGHT — forward navigation
    // ---------------------------------------------------------------------------

    describe('ARROWRIGHT — forward navigation', () => {
        it('calls getImagePath with the next image after pressing ARROWRIGHT', () => {
            const images = makeImages(3);
            const getImagePath = vi.fn((item: GalleryImage) => `stills/${item.path}`);
            const config = makeConfig(images, { getImagePath });
            const env = createGalleryEnvironment(config);

            env.keyOverrides!['ARROWRIGHT']();

            expect(getImagePath).toHaveBeenCalledWith(images[1], 1);
        });

        it('wraps from the last image back to index 0 on ARROWRIGHT', () => {
            const images = makeImages(3);
            const getImagePath = vi.fn((item: GalleryImage) => `stills/${item.path}`);
            const config = makeConfig(images, { getImagePath });
            const env = createGalleryEnvironment(config);

            // Advance to last image (index 2)
            env.keyOverrides!['ARROWRIGHT'](); // → 1
            env.keyOverrides!['ARROWRIGHT'](); // → 2
            getImagePath.mockClear();

            // One more press wraps to 0
            env.keyOverrides!['ARROWRIGHT'](); // → 0

            expect(getImagePath).toHaveBeenCalledWith(images[0], 0);
        });

        it('handles a single-image gallery without throwing', () => {
            const images = makeImages(1);
            const getImagePath = vi.fn((item: GalleryImage) => `stills/${item.path}`);
            const config = makeConfig(images, { getImagePath });
            const env = createGalleryEnvironment(config);

            env.keyOverrides!['ARROWRIGHT']();

            expect(getImagePath).toHaveBeenCalledWith(images[0], 0);
        });
    });

    // ---------------------------------------------------------------------------
    // ARROWLEFT — backward navigation
    // ---------------------------------------------------------------------------

    describe('ARROWLEFT — backward navigation', () => {
        it('wraps from index 0 to the last image on ARROWLEFT', () => {
            const images = makeImages(3);
            const getImagePath = vi.fn((item: GalleryImage) => `stills/${item.path}`);
            const config = makeConfig(images, { getImagePath });
            const env = createGalleryEnvironment(config);

            // Initial index is 0; pressing left wraps to last
            env.keyOverrides!['ARROWLEFT']();

            expect(getImagePath).toHaveBeenCalledWith(images[2], 2);
        });

        it('moves to the previous image on ARROWLEFT when not at index 0', () => {
            const images = makeImages(3);
            const getImagePath = vi.fn((item: GalleryImage) => `stills/${item.path}`);
            const config = makeConfig(images, { getImagePath });
            const env = createGalleryEnvironment(config);

            // Go right to index 2 first
            env.keyOverrides!['ARROWRIGHT'](); // → 1
            env.keyOverrides!['ARROWRIGHT'](); // → 2
            getImagePath.mockClear();

            env.keyOverrides!['ARROWLEFT'](); // → 1

            expect(getImagePath).toHaveBeenCalledWith(images[1], 1);
        });
    });

    // ---------------------------------------------------------------------------
    // additionalCommands — merged into overrideScope
    // ---------------------------------------------------------------------------

    describe('additionalCommands', () => {
        it('exposes additionalCommands in overrideScope when provided', () => {
            const images = makeImages(3);
            const helpFn = vi.fn(() => ['help text']);
            const config = makeConfig(images, {
                additionalCommands: { help: helpFn },
            });
            const env = createGalleryEnvironment(config);

            expect(env.overrideScope).toBeDefined();
            expect(typeof (env.overrideScope as Record<string, unknown>)['help']).toBe('function');
        });

        it('invokes the additionalCommands function when called through overrideScope', () => {
            const images = makeImages(3);
            const helpFn = vi.fn(() => ['help text']);
            const config = makeConfig(images, {
                additionalCommands: { help: helpFn },
            });
            const env = createGalleryEnvironment(config);

            const scope = env.overrideScope as Record<string, () => string[]>;
            scope['help']();

            expect(helpFn).toHaveBeenCalledTimes(1);
        });

        it('sets overrideScope to an empty object when no additionalCommands given', () => {
            const images = makeImages(2);
            const config = makeConfig(images);
            const env = createGalleryEnvironment(config);

            // overrideScope should be defined but contain no extra commands
            expect(env.overrideScope).toBeDefined();
            const scope = env.overrideScope as Record<string, unknown>;
            expect(Object.keys(scope).length).toBe(0);
        });
    });

    // ---------------------------------------------------------------------------
    // ShopImage — generic type support
    // ---------------------------------------------------------------------------

    describe('ShopImage generic type', () => {
        it('works with ShopImage entries and passes itemMapId to getImagePath', () => {
            const shopImages: ShopImage[] = [
                { path: 'shop.jpg', itemMapId: 0 },
                { path: 'item1.jpg', itemMapId: 1 },
            ];
            const getImagePath = vi.fn((item: ShopImage) => `shop/${item.path}`);
            const config: GalleryConfig<ShopImage> = {
                images: shopImages,
                getImagePath,
                initialResponse: ['Shop!'],
            };
            const env = createGalleryEnvironment(config);

            env.keyOverrides!['ARROWRIGHT']();

            expect(getImagePath).toHaveBeenCalledWith(shopImages[1], 1);
        });
    });
});

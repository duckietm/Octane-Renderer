import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FurnitureBrandedImageVisualization } from './FurnitureBrandedImageVisualization';
import { FurnitureRoomBackgroundVisualization } from './FurnitureRoomBackgroundVisualization';
import { FurnitureVisualization } from './FurnitureVisualization';

// AIR draws a room background (branded image) at half size in a size 32 visualization, with its image
// offsets and the branding offsets halved too.
const background = (validSizes: number[], imageUrl: string = 'https://images.example/bg.png') =>
{
    const visualization = Object.create(FurnitureRoomBackgroundVisualization.prototype);
    const texture = { width: 200, height: 100 };
    const sprite = { texture, scale: 1 };

    Object.assign(visualization, {
        _data: { getValidSize: (scale: number) => (validSizes.includes(scale) ? scale : validSizes[0]) },
        _imageUrl: imageUrl,
        _offsetX: 10,
        _offsetY: 20,
        _offsetZ: 0,
        _direction: 2,
        _halfSizeImage: null,
        _halfSizeImageUrl: null
    });
    visualization._imageOffsets = new Map([ [ 64, visualization.createImageOffset(200, 100) ], [ 32, visualization.createImageOffset(100, 50) ] ]);
    visualization.getSprite = () => sprite;
    visualization.getLayerTag = () => (FurnitureBrandedImageVisualization as unknown as { BRANDED_IMAGE: string }).BRANDED_IMAGE;

    return { visualization, sprite, texture };
};

describe('FurnitureRoomBackgroundVisualization', () =>
{
    beforeEach(() =>
    {
        vi.useFakeTimers();
        vi.spyOn(FurnitureVisualization.prototype as unknown as { updateSprite: () => void }, 'updateSprite').mockImplementation(() => undefined);
    });

    afterEach(() =>
    {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('halves the image and branding offsets in a size 32 visualization', () =>
    {
        const { visualization } = background([ 64, 32 ]);

        expect(visualization.getLayerXOffset(64, 7, 0)).toBe(-200 + 10);
        expect(visualization.getLayerYOffset(64, 7, 0)).toBe(-100 + 20);
        expect(visualization.getLayerXOffset(32, 7, 0)).toBe(-100 + 5);
        expect(visualization.getLayerYOffset(32, 7, 0)).toBe(-50 + 10);
    });

    it('leaves the offsets at size 64 when there is no size 32, since the 64 sprites are scaled down', () =>
    {
        const { visualization } = background([ 64 ]);

        expect(visualization.getLayerXOffset(32, 7, 0)).toBe(-200 + 10);
    });

    it('draws the image at half size at size 64 too when its url says force32', () =>
    {
        const { visualization, sprite } = background([ 64 ], 'https://images.example/bg_force32.png');

        visualization.updateSprite(64, 0);

        expect(sprite.scale).toBe(0.5);
        expect(visualization.getLayerXOffset(64, 7, 0)).toBe(-100 + 10);
    });

    it('draws the image at half size until the resampled copy is ready', () =>
    {
        const { visualization, sprite, texture } = background([ 64, 32 ]);

        visualization.updateSprite(32, 0);

        // The first draw scales on the GPU while the half-size copy is built off the render path.
        expect(sprite.texture).toBe(texture);
        expect(sprite.scale).toBe(0.5);

        sprite.scale = 1;
        visualization.updateSprite(64, 0);

        expect(sprite.scale).toBe(1);
    });

    it('keeps the full size for a url that says noscale', () =>
    {
        const { visualization, sprite } = background([ 64, 32 ], 'https://images.example/bg_noscale.png');

        visualization.updateSprite(32, 0);

        // The image keeps its full size, so its offsets do too; the branding offset follows the size.
        expect(sprite.scale).toBe(1);
        expect(visualization.getLayerXOffset(32, 7, 0)).toBe(-200 + 5);
    });
});

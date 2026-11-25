import { IRoomObjectSprite, RoomObjectSpriteType } from '@octane/api';
import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';
import { SortableSprite } from '../utils';
import { averageColorOfPixels, setTexturePixelReader, textureAverageColor } from './AverageColor';
import { RoomObjectCache } from './RoomObjectCache';

const fakeTexture = (): Texture => ({ destroyed: false }) as unknown as Texture;

const rgba = (...pixels: number[][]): Uint8ClampedArray => Uint8ClampedArray.from(pixels.flat());

describe('average colour (AIR Canvas.averageColor)', () =>
{
    afterEach(() => setTexturePixelReader());

    it('averages the pixels that are not fully transparent and truncates each channel', () =>
    {
        expect(averageColorOfPixels(rgba([ 255, 0, 10, 255 ], [ 0, 255, 11, 1 ], [ 9, 9, 9, 0 ]))).toBe((127 << 16) | (127 << 8) | 10);
        expect(averageColorOfPixels(rgba([ 9, 9, 9, 0 ]))).toBe(0xFFFFFF);
        expect(averageColorOfPixels(new Uint8ClampedArray(0))).toBe(0xFFFFFF);
    });

    it('reads a texture once and gives white for a missing one', () =>
    {
        const texture = fakeTexture();
        let reads = 0;

        setTexturePixelReader(() =>
        {
            reads++;

            return rgba([ 10, 20, 30, 255 ]);
        });

        expect(textureAverageColor(texture)).toBe(0x0A141E);
        expect(textureAverageColor(texture)).toBe(0x0A141E);
        expect(reads).toBe(1);
        expect(textureAverageColor(null)).toBe(0xFFFFFF);
        expect(textureAverageColor(Texture.EMPTY)).toBe(0xFFFFFF);
    });

    it('gives white when the pixels cannot be read', () =>
    {
        setTexturePixelReader(() =>
        {
            throw new Error('no renderer');
        });

        expect(textureAverageColor(fakeTexture())).toBe(0xFFFFFF);
    });
});

describe('RoomObjectCache.getSortableSpriteList average colours', () =>
{
    afterEach(() => setTexturePixelReader());

    const addSprite = (cache: RoomObjectCache, id: number, values: Partial<IRoomObjectSprite>): void =>
    {
        const item = cache.getObjectCache(id);

        item.objectId = id;

        const sortable = new SortableSprite();

        sortable.sprite = Object.assign({
            spriteType: RoomObjectSpriteType.DEFAULT,
            libraryAssetName: '',
            flipH: false,
            alpha: 255,
            color: 0xFFFFFF,
            blendMode: 'normal',
            width: 39,
            height: 39,
            type: 'guild_furni',
            posture: null,
            direction: 0,
            tag: '',
            texture: fakeTexture()
        }, values) as unknown as IRoomObjectSprite;
        sortable.x = 10;
        sortable.y = 20;
        sortable.z = 5;

        item.sprites.addSprite(sortable);
    };

    it('replaces the colour of small group badges, library images and skewed thumbnails, like AIR', () =>
    {
        setTexturePixelReader(() => rgba([ 200, 100, 50, 255 ], [ 100, 50, 0, 255 ]));

        const cache = new RoomObjectCache('accurateZ');

        addSprite(cache, 1, { libraryAssetName: '%group.badge.url%b001034', color: 0x112233 });
        addSprite(cache, 2, { libraryAssetName: '%image.library.url%album1584/ACH.png', width: 40, height: 40 });
        addSprite(cache, 3, { libraryAssetName: 'http://photos.example/1.png', type: 'external_image_wallitem_poster', tag: 'THUMBNAIL', direction: 2, width: 64, height: 64 });
        addSprite(cache, 4, { libraryAssetName: '%group.badge.url%b001034', width: 201, height: 39 });
        addSprite(cache, 5, { libraryAssetName: 'chair_64_a_0_0', color: 0x445566 });

        const byId = new Map(cache.getSortableSpriteList().map(data => [ data.objectId, data ]));
        const average = String((150 << 16) | (75 << 8) | 25);

        expect(byId.get(1).color).toBe(average);
        expect(byId.get(2).color).toBe(average);
        expect(byId.get(3).color).toBe(average);
        expect(byId.get(3).skew).toBe(0.5);
        expect(byId.get(3).frame).toBe(true);
        // Over MAX_SIZE_FOR_AVG_COLOR the sprite keeps its own colour.
        expect(byId.get(4).color).toBe(String(0xFFFFFF));
        expect(byId.get(5).color).toBe(String(0x445566));
    });
});

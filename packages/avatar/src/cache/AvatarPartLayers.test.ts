import { Container, Matrix, Point, Rectangle, Sprite, Texture, TextureSource } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarImageBodyPartContainer, AvatarPartLayer } from '../AvatarImageBodyPartContainer';
import { AvatarAtlasQuad } from './AvatarAtlasBatch';
import { AvatarAtlasGl } from './AvatarAtlasGl';
import { AvatarImageCache } from './AvatarImageCache';
import { ImageData } from './ImageData';

type UnionResult = { rect: Rectangle, regPoint: Point, width: number, height: number };
type PartAsset = { texture: Texture, rect: Rectangle, x: number, y: number, flipH: boolean, color: number };

let textures: Texture[] = [];

const makeTexture = (width: number, height: number, trim: Rectangle = null): Texture =>
{
    const source = new TextureSource({ width: 64, height: 64 });
    const texture = trim
        ? new Texture({ source, frame: new Rectangle(3, 5, trim.width, trim.height), orig: new Rectangle(0, 0, width, height), trim })
        : new Texture({ source, frame: new Rectangle(3, 5, width, height) });

    textures.push(texture);

    return texture;
};

const imageData = (assets: PartAsset[]): ImageData[] => assets.map(asset => new ImageData(asset.texture, asset.rect, new Point(asset.x, asset.y), asset.flipH, asset.color));

// The container the cache built for a body part before parts became layer lists (kept here as the reference).
const legacyUnionImage = (images: ImageData[], isFlipped: boolean): ImageData =>
{
    const matrix = new Matrix();
    const bounds = new Rectangle();

    for(const data of images) data && bounds.enlarge(data.offsetRect);

    const point = new Point(-(bounds.x), -(bounds.y));
    const container = new Container();
    const sizing = new Sprite(Texture.EMPTY);

    sizing.width = bounds.width;
    sizing.height = bounds.height;

    container.addChild(sizing);

    for(const data of images)
    {
        if(!data) continue;

        const regPoint = point.clone();

        regPoint.x -= data.regPoint.x;
        regPoint.y -= data.regPoint.y;

        if(isFlipped) regPoint.x = (container.width - (regPoint.x + data.rect.width));

        if(isFlipped != data.flipH)
        {
            matrix.a = -1;
            matrix.tx = ((data.rect.x + data.rect.width) + regPoint.x);
            matrix.ty = (regPoint.y - data.rect.y);
        }
        else
        {
            matrix.a = 1;
            matrix.tx = (regPoint.x - data.rect.x);
            matrix.ty = (regPoint.y - data.rect.y);
        }

        const sprite = new Sprite(data.texture);

        sprite.tint = data.colorTransform;
        sprite.setFromMatrix(matrix);

        container.addChild(sprite);
    }

    return new ImageData(null, container.getLocalBounds().rectangle, point, isFlipped, null, container);
};

const cases: [string, () => PartAsset[]][] = [
    [ 'one asset', () => [
        { texture: makeTexture(20, 30), rect: new Rectangle(0, 0, 20, 30), x: 22, y: 71, flipH: false, color: 0xFFFFFF }
    ] ],
    [ 'several coloured assets', () => [
        { texture: makeTexture(20, 30), rect: new Rectangle(0, 0, 20, 30), x: 22, y: 71, flipH: false, color: 0xE8B137 },
        { texture: makeTexture(9, 11), rect: new Rectangle(0, 0, 9, 11), x: 5, y: 80, flipH: false, color: 0x336699 },
        { texture: makeTexture(31, 6), rect: new Rectangle(0, 0, 31, 6), x: 30, y: 40, flipH: false, color: 0xFFFFFF }
    ] ],
    [ 'assets on both sides of the origin', () => [
        { texture: makeTexture(20, 30), rect: new Rectangle(0, 0, 20, 30), x: -12, y: 15, flipH: false, color: 0xFFFFFF },
        { texture: makeTexture(14, 8), rect: new Rectangle(0, 0, 14, 8), x: 40, y: -9, flipH: false, color: 0x123456 }
    ] ],
    [ 'assets that keep their own flip (hand items)', () => [
        { texture: makeTexture(20, 30), rect: new Rectangle(0, 0, 20, 30), x: 22 + 65, y: 71, flipH: true, color: 0xFFFFFF },
        { texture: makeTexture(9, 11), rect: new Rectangle(0, 0, 9, 11), x: 5, y: 80, flipH: false, color: 0x00FF00 }
    ] ],
    [ 'assets cut out of a sheet at an offset', () => [
        { texture: makeTexture(20, 30), rect: new Rectangle(4, 6, 20, 30), x: 22, y: 71, flipH: false, color: 0xFFFFFF },
        { texture: makeTexture(9, 11), rect: new Rectangle(2, 1, 9, 11), x: 5, y: 80, flipH: true, color: 0xABCDEF }
    ] ],
    [ 'trimmed textures', () => [
        { texture: makeTexture(20, 30, new Rectangle(2, 3, 15, 20)), rect: new Rectangle(0, 0, 20, 30), x: 22, y: 71, flipH: false, color: 0xFFFFFF },
        { texture: makeTexture(9, 11, new Rectangle(1, 0, 7, 9)), rect: new Rectangle(0, 0, 9, 11), x: 5, y: 80, flipH: true, color: 0x778899 }
    ] ]
];

const childMatrices = (container: Container) => container.children.map(child =>
{
    child.updateLocalTransform();

    const matrix = child.localTransform;

    return [ matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty ];
});

const rectangle = (rect: Rectangle) => [ rect.x, rect.y, rect.width, rect.height ];
// Pixi leaves a negative zero in some bounds; it is the same position.
const plain = (values: number[]) => values.map(value => (value + 0));

afterEach(() =>
{
    for(const texture of textures) if(!texture.destroyed) texture.destroy(true);

    textures = [];
});

describe('avatar body part layers', () =>
{
    const union = (assets: PartAsset[], isFlipped: boolean): { result: UnionResult, layers: AvatarPartLayer[] } =>
    {
        const cache = new AvatarImageCache(null, null, null, 'h');
        const layers: AvatarPartLayer[] = [];
        const result = (cache as unknown as { createUnionImage(images: ImageData[], isFlipped: boolean, layers: AvatarPartLayer[]): UnionResult }).createUnionImage(imageData(assets), isFlipped, layers);

        return { result, layers };
    };

    describe.each(cases)('%s', (_, makeAssets) =>
    {
        it.each([ false, true ])('lays the layers out as the container version did (body part flipped: %s)', isFlipped =>
        {
            const assets = makeAssets();
            const legacy = legacyUnionImage(imageData(assets), isFlipped);
            const { result, layers } = union(assets, isFlipped);
            const part = new AvatarImageBodyPartContainer(layers, result.width, result.height, new Point(), true, result.rect);

            expect(rectangle(result.rect)).toEqual(rectangle(legacy.rect));
            expect([ result.regPoint.x, result.regPoint.y ]).toEqual([ legacy.regPoint.x, legacy.regPoint.y ]);
            expect(layers).toHaveLength(assets.length);

            // The Pixi tree built from the layers on first use is the tree the cache used to build.
            const image = part.image;

            expect(image.children).toHaveLength(legacy.container.children.length);
            expect(childMatrices(image)).toEqual(childMatrices(legacy.container));
            expect(image.children.map(child => (child as Sprite).texture)).toEqual(legacy.container.children.map(child => (child as Sprite).texture));
            expect(image.children.map(child => child.tint)).toEqual(legacy.container.children.map(child => child.tint));
            expect(rectangle(image.getLocalBounds().rectangle)).toEqual(rectangle(legacy.rect));
            expect(part.image).toBe(image);

            part.dispose();
            legacy.dispose();
        });

        it.each([ false, true ])('gives the atlas the quads of those sprites (body part flipped: %s)', isFlipped =>
        {
            const assets = makeAssets();
            const { result, layers } = union(assets, isFlipped);
            const part = new AvatarImageBodyPartContainer(layers, result.width, result.height, new Point(), true, result.rect);
            // Child 0 is the sizing sprite.
            const sprites = part.image.children.slice(1) as Sprite[];
            const layerQuad = (AvatarAtlasGl as unknown as { layerQuad(layer: AvatarPartLayer): { left: number, right: number, top: number, bottom: number, color: number } }).layerQuad;

            layers.forEach((layer, index) =>
            {
                const sprite = sprites[index];
                // What Pixi draws for a sprite: the trimmed rectangle when the texture has one.
                const bounds = sprite.visualBounds;

                sprite.updateLocalTransform();

                const topLeft = sprite.localTransform.apply(new Point(bounds.minX, bounds.minY));
                const bottomRight = sprite.localTransform.apply(new Point(bounds.maxX, bounds.maxY));

                // WebGL2 writer: the corner where the texture's left edge lands, then its right edge.
                const quad = layerQuad(layer);

                expect(plain([ quad.left, quad.top, quad.right, quad.bottom ])).toEqual(plain([ topLeft.x, topLeft.y, bottomRight.x, bottomRight.y ]));
                expect(quad.color >>> 24).toBe(0xFF);
                expect(plain([ (quad.color & 0xFF), ((quad.color >> 8) & 0xFF), ((quad.color >> 16) & 0xFF) ])).toEqual(plain([ ((layer.tint >> 16) & 0xFF), ((layer.tint >> 8) & 0xFF), (layer.tint & 0xFF) ]));

                // Pixi batch fallback: the sprite's own bounds drawn through the sprite's own matrix, moved to the cell.
                const batchQuad = new AvatarAtlasQuad();

                batchQuad.set(layer.texture, (100 + layer.x), (200 + layer.y), layer.flipped, layer.tint);

                expect(plain([ batchQuad.bounds.minX, batchQuad.bounds.minY, batchQuad.bounds.maxX, batchQuad.bounds.maxY ])).toEqual(plain([ bounds.minX, bounds.minY, bounds.maxX, bounds.maxY ]));
                expect(plain([ batchQuad.transform.a, batchQuad.transform.b, batchQuad.transform.c, batchQuad.transform.d ])).toEqual(plain([ sprite.localTransform.a, sprite.localTransform.b, sprite.localTransform.c, sprite.localTransform.d ]));
                expect(plain([ batchQuad.transform.tx, batchQuad.transform.ty ])).toEqual(plain([ (100 + sprite.localTransform.tx), (200 + sprite.localTransform.ty) ]));
                expect(batchQuad.color).toBe(quad.color);
            });

            part.dispose();
        });
    });

    it('builds the Pixi tree only when it is asked for, and again after a caller destroyed it', () =>
    {
        const texture = makeTexture(8, 12);
        const part = new AvatarImageBodyPartContainer([{ texture, flipped: false, x: 1, y: 2, tint: 0xFFFFFF }], 8, 12, new Point(4, 5), true, new Rectangle(0, 0, 9, 14));
        const internals = part as unknown as { _image: Container };

        part.setOffset(10, 20);

        expect(internals._image).toBeNull();
        expect([ part.regX, part.regY ]).toEqual([ 14, 25 ]);
        expect([ part.regPoint.x, part.regPoint.y ]).toEqual([ 14, 25 ]);

        const first = part.image;

        first.destroy({ children: true });

        const second = part.image;

        expect(second).not.toBe(first);
        expect(second.destroyed).toBe(false);

        part.dispose();

        expect(part.layers).toBeNull();
        expect(part.image).toBeNull();
        expect(second.destroyed).toBe(true);
        expect(texture.destroyed).toBe(false);
    });
});

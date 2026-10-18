import { IPlaneDrawingData } from '@octane/api';
import { inflate } from 'pako';
import { describe, expect, it } from 'vitest';
import { fletcher100, makeMagicString, stringToByteArray } from './RenderRoomCrypto';
import { RenderRoomMessageComposer } from './RenderRoomMessageComposer';
import { RenderRoomThumbnailMessageComposer } from './RenderRoomThumbnailMessageComposer';

const point = (x: number, y: number) => ({ x, y }) as IPlaneDrawingData['cornerPoints'][number];

const backgroundPlane = (): IPlaneDrawingData => ({
    z: 10.5,
    cornerPoints: [ point(320, 320), point(0, 320), point(320, 0), point(0, 0) ],
    color: 0,
    maskAssetNames: [],
    maskAssetLocations: [],
    maskAssetFlipHs: [],
    maskAssetFlipVs: [],
    assetNameColumns: [],
    isBottomAligned: () => false
});

const SPRITES = '[{"name":"chair_64_a_2_0","x":1,"y":2,"z":3}]';
const TIME = 1700000000123;

// Computed with an independent port of the AS3 compressData (time 1700000000123, room 12, security level 0).
const EXPECTED_FIRST = '{ "planes" : [{"z":10.5,"cornerPoints":[{"x":320,"y":320},{"x":0,"y":320},{"x":320,"y":0},{"x":0,"y":0}],"color":0,"bottomAligned":false,"texCols":[]}],"sprites" : [{"name":"chair_64_a_2_0","x":1,"y":2,"z":3}],"modifiers" : {},"filters" : [],"roomid" : 12,"status" : 19,"timestamp" : 1700000000145,"checksum" : 27576 }';
const EXPECTED_SECOND = '{ "planes" : [{"z":10.5,"cornerPoints":[{"x":320,"y":320},{"x":0,"y":320},{"x":320,"y":0},{"x":0,"y":0}],"color":0,"bottomAligned":false,"texCols":[]}],"sprites" : [{"name":"chair_64_a_2_0","x":1,"y":2,"z":3}],"modifiers" : {},"filters" : [{"name":"black_white_negative","alpha":127},{"name":"frame_gold"}],"roomid" : 12,"zoom" : 2,"status" : 19,"timestamp" : 1700000000100,"checksum" : 10946 }';

describe('AIR render room crypto', () =>
{
    it('decodes the AIR magic strings to the JSON keys', () =>
    {
        expect(makeMagicString(142, 178, 155, 183, 194, 196, 168, 157, 195, 152, 143, 163, 197, 154, 200, 148, 158, 148, 200)).toBe('{ "planes" : ');
        expect(makeMagicString(113, 119, 172, 167, 152, 139, 154, 118, 141, 140, 125, 169, 152, 119, 168, 165, 129, 146)).toBe(',"sprites" : ');
        expect(makeMagicString(129, 188, 141, 133, 186, 137, 164, 132, 160, 132, 185, 134, 168, 183, 162, 149, 181, 135)).toBe(',"modifiers" : ');
        expect(makeMagicString(131, 190, 163, 186, 162, 159, 146, 177, 172, 172, 132, 136, 170, 186, 164, 151, 164)).toBe(',"filters" : ');
        expect(makeMagicString(122, 181, 177, 127, 144, 130, 147, 129, 125, 157, 126, 145, 142, 145, 170)).toBe(',"roomid" : ');
        expect(makeMagicString(126, 132, 128, 180, 166, 134, 158, 167, 151, 148, 133, 132, 181, 159, 146, 158, 159)).toBe(',"zoom" : ');
        expect(makeMagicString(118, 124, 120, 172, 157, 164, 171, 145, 167, 143, 139, 173, 154, 159, 141, 134, 170)).toBe(',"status" : ');
        expect(makeMagicString(137, 178, 196, 192, 164, 143, 165, 144, 193, 158, 164, 155, 143, 144, 163, 191, 160, 153, 149, 173, 169, 173, 195)).toBe(',"timestamp" : ');
        expect(makeMagicString(120, 179, 124, 161, 132, 139, 150, 176, 139, 145, 157, 141, 169, 127, 152, 175, 153, 140, 156, 143)).toBe(',"checksum" : ');
        expect(makeMagicString(136, 148, 159, 145, 168)).toBe(' }');
    });

    it('computes fletcher100 like CryptoTools', () =>
    {
        expect(fletcher100(stringToByteArray('abc'), 0, 0)).toBe(15);
        expect(fletcher100(stringToByteArray('abc'), 10, 300)).toBe(0);
        expect(fletcher100(new Uint8Array(0), 7, 8)).toBe(15);
    });

    it('keeps the low byte of each character like ByteArray.writeByte', () =>
    {
        expect([ ...stringToByteArray('AŁ') ]).toEqual([ 0x41, 0x41 ]);
    });
});

describe('RenderRoomMessageComposer AIR scene', () =>
{
    it('builds the exact AIR JSON string, status, timestamp and checksum', () =>
    {
        const composer = new RenderRoomMessageComposer();

        composer.assignRenderData([ backgroundPlane() ], SPRITES, '{}', 12, 0, TIME);
        composer.compressData();

        expect(composer.renderDataString).toBe(EXPECTED_FIRST);
    });

    it('re-packs with effects and zoom like the purchase dialog, keeping AIR\'s rounded time', () =>
    {
        const composer = new RenderRoomMessageComposer();

        composer.assignRenderData([ backgroundPlane() ], SPRITES, '{}', 12, 0, TIME);

        // The shutter: isSendable packs once with no effects.
        expect(composer.isSendable()).toBe(true);
        expect(composer.renderDataString).toBe(EXPECTED_FIRST);

        composer.addEffectData('[{"name":"black_white_negative","alpha":127},{"name":"frame_gold"}]');
        composer.setZoom(2);
        composer.compressData();

        expect(composer.renderDataString).toBe(EXPECTED_SECOND);
    });

    it('sends the zlib-deflated string as an int length and the bytes', () =>
    {
        const composer = new RenderRoomMessageComposer();

        composer.assignRenderData([ backgroundPlane() ], SPRITES, '{}', 12, 0, TIME);
        composer.compressData();

        const message = composer.getMessageArray() as unknown as [ number, ArrayBuffer ];

        expect(message).toHaveLength(2);
        expect(message[1]).toBeInstanceOf(ArrayBuffer);
        expect(message[0]).toBe(message[1].byteLength);

        const bytes = new Uint8Array(message[1]);

        // zlib header (CMF 0x78), not raw deflate or gzip.
        expect(bytes[0]).toBe(0x78);
        expect(new TextDecoder().decode(inflate(bytes))).toBe(EXPECTED_FIRST);
    });

    it('leaves out empty mask lists and writes masks and texture columns in AIR\'s shape', () =>
    {
        const plane: IPlaneDrawingData = {
            ...backgroundPlane(),
            z: 3,
            color: 0xFFFFFF,
            maskAssetNames: [ 'door_64' ],
            maskAssetLocations: [ point(10.7, -4.2) ],
            maskAssetFlipHs: [ true ],
            maskAssetFlipVs: [ false ],
            assetNameColumns: [ [ 'wall_texture_64_0_wall_color_basic', '' ] ],
            isBottomAligned: () => true
        };

        expect(JSON.stringify(RenderRoomMessageComposer.getRoomPlanesDataArray([ plane, backgroundPlane() ]))).toBe(
            '[{"z":3,"cornerPoints":[{"x":320,"y":320},{"x":0,"y":320},{"x":320,"y":0},{"x":0,"y":0}],"masks":[{"name":"door_64","location":{"x":10,"y":-4},"flipH":true,"flipV":false}],"color":16777215,"bottomAligned":true,"texCols":[{"assetNames":["wall_texture_64_0_wall_color_basic",""]}]},'
            + '{"z":10.5,"cornerPoints":[{"x":320,"y":320},{"x":0,"y":320},{"x":320,"y":0},{"x":0,"y":0}],"color":0,"bottomAligned":false,"texCols":[]}]');
    });

    it('keeps the PNG upload path', () =>
    {
        const composer = new RenderRoomThumbnailMessageComposer();
        const png = btoa(String.fromCharCode(0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 0));

        composer.assignBase64(`data:image/png;base64,${ png }`);

        const message = composer.getMessageArray() as unknown as [ number, ArrayBuffer ];

        expect(message[0]).toBe(8);
        expect(composer.hasRenderData).toBe(false);
    });
});

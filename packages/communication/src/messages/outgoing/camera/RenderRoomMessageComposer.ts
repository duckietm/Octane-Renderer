import { IMessageComposer, IPlaneDrawingData } from '@octane/api';
import { OctaneLogger, TextureUtils } from '@octane/utils';
import { deflate } from 'pako';
import { RenderTexture } from 'pixi.js';
import { fletcher100, makeMagicString, stringToByteArray } from './RenderRoomCrypto';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4E, 0x47];

// The JSON keys of the AIR render room message, exactly as the AIR client builds them with makeMagicString.
const PLANES_KEY = (): string => makeMagicString(142, 178, 155, 183, 194, 196, 168, 157, 195, 152, 143, 163, 197, 154, 200, 148, 158, 148, 200);
const SPRITES_KEY = (): string => makeMagicString(113, 119, 172, 167, 152, 139, 154, 118, 141, 140, 125, 169, 152, 119, 168, 165, 129, 146);
const MODIFIERS_KEY = (): string => makeMagicString(129, 188, 141, 133, 186, 137, 164, 132, 160, 132, 185, 134, 168, 183, 162, 149, 181, 135);
const FILTERS_KEY = (): string => makeMagicString(131, 190, 163, 186, 162, 159, 146, 177, 172, 172, 132, 136, 170, 186, 164, 151, 164);
const ROOM_ID_KEY = (): string => makeMagicString(122, 181, 177, 127, 144, 130, 147, 129, 125, 157, 126, 145, 142, 145, 170);
const ZOOM_KEY = (): string => makeMagicString(126, 132, 128, 180, 166, 134, 158, 167, 151, 148, 133, 132, 181, 159, 146, 158, 159);
const STATUS_KEY = (): string => makeMagicString(118, 124, 120, 172, 157, 164, 171, 145, 167, 143, 139, 173, 154, 159, 141, 134, 170);
const TIMESTAMP_KEY = (): string => makeMagicString(137, 178, 196, 192, 164, 143, 165, 144, 193, 158, 164, 155, 143, 144, 163, 191, 160, 153, 149, 173, 169, 173, 195);
const CHECKSUM_KEY = (): string => makeMagicString(120, 179, 124, 161, 132, 139, 150, 176, 139, 145, 157, 141, 169, 127, 152, 175, 153, 140, 156, 143);
const JSON_END = (): string => makeMagicString(136, 148, 159, 145, 168);

// AS3 int(): drop the fraction toward zero, then wrap to 32 bits.
const toInt = (value: number): number => (Math.trunc(Number(value) || 0) | 0);

/**
 * The room photo packet. Two ways to fill it:
 *  - the PNG upload (assignBitmap / assignBase64): the client renders the photo itself;
 *  - the AIR scene (assignRenderData, addEffectData, setZoom, compressData): behaviour from the AIR client's
 *    RenderRoomMessageComposer. The body is the zlib-deflated JSON scene and the server renders the photo.
 * Both send one byte array, written as an int length followed by the bytes.
 */
export class RenderRoomMessageComposer implements IMessageComposer<ConstructorParameters<typeof RenderRoomMessageComposer>>
{
    private _data: any;
    private _planes: unknown[] = null;
    private _sprites: string = null;
    private _modifiers: string = null;
    private _effects: string = '[]';
    private _roomId: number = 0;
    private _zoom: number = 1;
    private _topSecurityLevel: number = 0;
    private _time: number = 0;
    private _renderDataString: string = null;

    constructor(value: any = '', label: string = '', description: string = '', width: number = -1, height: number = -1)
    {
        this._data = [];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = [];
    }

    /**
     * AIR: new RenderRoomMessageComposer(planes, sprites, modifiers, roomId, topSecurityLevel). The time is taken here,
     * when the scene is captured, and compressData works from it.
     */
    public assignRenderData(planes: IPlaneDrawingData[], sprites: string, modifiers: string, roomId: number, topSecurityLevel: number, time: number = Date.now()): void
    {
        this._planes = RenderRoomMessageComposer.getRoomPlanesDataArray(planes || []);
        this._sprites = sprites;
        this._modifiers = modifiers;
        this._roomId = toInt(roomId);
        this._topSecurityLevel = toInt(topSecurityLevel);
        this._time = time;
        this._data = [];
    }

    public get hasRenderData(): boolean
    {
        return (this._planes !== null);
    }

    // The effects as the AIR photo lab writes them: [{"name":..,"alpha":0..255}, ..., frames last as {"name":..}].
    public addEffectData(effects: string): void
    {
        this._effects = effects;
    }

    public setZoom(zoom: number): void
    {
        this._zoom = toInt(zoom);
    }

    // AIR isSendable: packs the scene the first time and always answers true.
    public isSendable(): boolean
    {
        if(this.hasRenderData && !this._data.length) this.compressData();

        return true;
    }

    // The JSON string of the last compressData, before it was deflated.
    public get renderDataString(): string
    {
        return this._renderDataString;
    }

    public compressData(): void
    {
        if(!this.hasRenderData) return;

        const planes = JSON.stringify(this._planes);

        let value = PLANES_KEY() + planes + SPRITES_KEY() + this._sprites + MODIFIERS_KEY() + this._modifiers + FILTERS_KEY() + this._effects + ROOM_ID_KEY() + this._roomId;

        if(this._zoom !== 1) value += ZOOM_KEY() + this._zoom;

        // Like AIR, the time keeps its rounding between calls: a second compressData sees no last digits.
        const timeLastDigits = toInt(this._time % 100);

        this._time -= timeLastDigits;

        const status = toInt(((this._time / 100) % 23) + this._topSecurityLevel);

        value += STATUS_KEY() + status;

        let check = value.length;

        check = toInt((check + ((this._time / 100) * 17)) % 1493);

        const checksum = fletcher100(stringToByteArray(value), check, this._roomId);

        value += TIMESTAMP_KEY() + (this._time + checksum);
        value += CHECKSUM_KEY() + ((timeLastDigits + 13) * (check + 29)) + JSON_END();

        this._renderDataString = value;

        // ByteArray.writeUTFBytes + compress('zlib').
        const bytes = deflate(new TextEncoder().encode(value));
        const buffer = bytes.buffer.slice(bytes.byteOffset, (bytes.byteOffset + bytes.byteLength));

        this._data = [];
        this._data.push(bytes.byteLength, buffer);
    }

    // AIR getRoomPlanesDataArray + the Json*DrawingData classes; empty mask lists are left out, as AIR's replacer does.
    public static getRoomPlanesDataArray(planes: IPlaneDrawingData[]): unknown[]
    {
        const result: unknown[] = [];

        for(const plane of planes)
        {
            if(!plane) continue;

            const corners = plane.cornerPoints || [];
            const cornerPoints: { x: number, y: number }[] = [];

            for(let i = 0; i < 4; i++)
            {
                const point = corners[i];

                cornerPoints.push({ x: toInt(point ? point.x : 0), y: toInt(point ? point.y : 0) });
            }

            const masks: { name: string, location: { x: number, y: number }, flipH: boolean, flipV: boolean }[] = [];
            const maskNames = plane.maskAssetNames || [];

            for(let i = 0; i < maskNames.length; i++)
            {
                const location = plane.maskAssetLocations[i];

                masks.push({
                    name: maskNames[i],
                    location: { x: toInt(location ? location.x : 0), y: toInt(location ? location.y : 0) },
                    flipH: !!plane.maskAssetFlipHs[i],
                    flipV: !!plane.maskAssetFlipVs[i]
                });
            }

            const texCols: { assetNames: string[] }[] = [];

            for(const column of (plane.assetNameColumns || [])) texCols.push({ assetNames: [ ...column ] });

            const entry: Record<string, unknown> = { z: plane.z, cornerPoints };

            if(masks.length) entry.masks = masks;

            entry.color = ((plane.color >>> 0) || 0);
            entry.bottomAligned = !!plane.isBottomAligned();
            entry.texCols = texCols;

            result.push(entry);
        }

        return result;
    }

    public async assignBitmap(texture: RenderTexture): Promise<void>
    {
        const url = await TextureUtils.generateImageUrl(texture);

        if(!url) return;

        this.processBase64(url);
    }

    public assignBase64(base64: string): void
    {
        this.processBase64(base64);
    }

    private processBase64(base64: string): void
    {
        if(!base64 || !base64.includes(','))
        {
            OctaneLogger.error('Camera: invalid base64 data URL');
            return;
        }

        if(!base64.startsWith('data:image/png'))
        {
            OctaneLogger.error('Camera: rejected non-PNG image data');
            return;
        }

        const base64Data = base64.split(',')[1];

        if(!base64Data || !base64Data.length)
        {
            OctaneLogger.error('Camera: empty base64 payload');
            return;
        }

        let binaryData: Uint8Array;

        try
        {
            binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        }
        catch (e)
        {
            OctaneLogger.error('Camera: failed to decode base64 data');
            return;
        }

        if(binaryData.byteLength > MAX_IMAGE_BYTES)
        {
            OctaneLogger.error(`Camera: image too large (${binaryData.byteLength} bytes, max ${MAX_IMAGE_BYTES})`);
            return;
        }

        if(binaryData.length < 4
            || binaryData[0] !== PNG_MAGIC_BYTES[0]
            || binaryData[1] !== PNG_MAGIC_BYTES[1]
            || binaryData[2] !== PNG_MAGIC_BYTES[2]
            || binaryData[3] !== PNG_MAGIC_BYTES[3])
        {
            OctaneLogger.error('Camera: binary data does not have valid PNG header');
            return;
        }

        this._data.push(binaryData.byteLength, binaryData.buffer);
    }
}

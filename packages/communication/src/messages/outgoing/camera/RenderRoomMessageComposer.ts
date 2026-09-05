import { IMessageComposer } from '@octane/api';
import { OctaneLogger, TextureUtils } from '@octane/utils';
import { RenderTexture } from 'pixi.js';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4E, 0x47];

export class RenderRoomMessageComposer implements IMessageComposer<ConstructorParameters<typeof RenderRoomMessageComposer>>
{
    private _data: any;

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

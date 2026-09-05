import { inflate } from 'pako';
import { Assets, Texture } from 'pixi.js';
import { ArrayBufferToBase64 } from './ArrayBufferToBase64';
import { BinaryReader } from './BinaryReader';

export type OctaneBundleTextureDecoder = (bytes: ArrayBuffer, entryName: string) => Promise<Texture>;

export class OctaneBundle
{
    private static TEXT_DECODER: TextDecoder = new TextDecoder('utf-8');

    private _jsonFile: object = null;
    private _texture: Texture = null;

    public static async from(buffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder = decodePngTexture): Promise<OctaneBundle>
    {
        const bundle = new OctaneBundle();

        await bundle.parse(buffer, textureDecoder);

        return bundle;
    }

    public async parse(arrayBuffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder = decodePngTexture): Promise<void>
    {
        const binaryReader = new BinaryReader(arrayBuffer);

        let fileCount = binaryReader.readShort();

        while(fileCount > 0)
        {
            const fileNameLength = binaryReader.readShort();
            const fileName = binaryReader.readBytes(fileNameLength).toString();
            const fileLength = binaryReader.readInt();
            const buffer = binaryReader.readBytes(fileLength);
            const inflatedBuffer = inflate(buffer.toArrayBuffer());

            if(fileName.endsWith('.json'))
            {
                this._jsonFile = JSON.parse(OctaneBundle.TEXT_DECODER.decode(inflatedBuffer));
            }
            else
            {
                this._texture = await textureDecoder(Uint8Array.from(inflatedBuffer).buffer, fileName);
            }

            fileCount--;
        }
    }

    public get jsonFile(): object
    {
        return this._jsonFile;
    }

    public get texture(): Texture
    {
        return this._texture;
    }
}

const decodePngTexture: OctaneBundleTextureDecoder = bytes =>
    Assets.load<Texture>(`data:image/png;base64,${ ArrayBufferToBase64(bytes) }`);

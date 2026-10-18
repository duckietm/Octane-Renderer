import { inflate } from 'pako';
import { Texture } from 'pixi.js';
import { BinaryReader } from './BinaryReader';
import { isHabBundle, readHabBundle } from './HabBundle';

export type OctaneBundleTextureDecoder = (bytes: ArrayBuffer, entryName: string) => Promise<Texture>;

export class OctaneBundle
{
    private static TEXT_DECODER: TextDecoder = new TextDecoder('utf-8');

    private _jsonFile: object = null;
    private _atlasFile: string = null;
    private _texture: Texture = null;

    public static async from(buffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder = decodePngTexture): Promise<OctaneBundle>
    {
        const bundle = new OctaneBundle();

        await bundle.parse(buffer, textureDecoder);

        return bundle;
    }

    public async parse(arrayBuffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder = decodePngTexture): Promise<void>
    {
        if(isHabBundle(arrayBuffer)) return this.parseHab(arrayBuffer, textureDecoder);

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
            else if(fileName.endsWith('.atlas'))
            {
                this._atlasFile = OctaneBundle.TEXT_DECODER.decode(inflatedBuffer);
            }
            else
            {
                this._texture = await textureDecoder(exactBuffer(inflatedBuffer), fileName);
            }

            fileCount--;
        }
    }

    /**
     * A .hab holding the same files as a .nitro: the asset json and its sheet image (Habbo's own .hab of
     * the old flash libraries, xml plus loose images, has to go through the converter first).
     */
    private async parseHab(arrayBuffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder): Promise<void>
    {
        const { name, entries } = readHabBundle(arrayBuffer);
        const images = entries.filter(entry => entry.mimeType.startsWith('image/') || /\.(png|webp|jpe?g|gif)$/i.test(entry.name));
        const json = entries.find(entry => entry.mimeType === 'application/json' || entry.name.endsWith('.json'));

        if(!json || images.length > 1)
            throw new Error(`HAB bundle "${ name }" is a flash-style library (xml and loose images); convert it to a sheet bundle first`);

        this._jsonFile = JSON.parse(OctaneBundle.TEXT_DECODER.decode(json.bytes));

        // Habbo's clothes and effect bundles name the library only in documentClass and the bundle index;
        // collections are registered under json.name, so a library without it would never be found.
        const data = this._jsonFile as { name?: string; documentClass?: string };

        if(data && !data.name) data.name = (data.documentClass || name || undefined);

        const atlas = entries.find(entry => entry.name.endsWith('.atlas'));

        if(atlas) this._atlasFile = OctaneBundle.TEXT_DECODER.decode(atlas.bytes);

        if(images.length) this._texture = await textureDecoder(exactBuffer(images[0].bytes), images[0].name);
    }

    public get jsonFile(): object
    {
        return this._jsonFile;
    }

    /** The text atlas describing the sheet, when the bundle carries one; the json stays the source of the frames. */
    public get atlasFile(): string
    {
        return this._atlasFile;
    }

    public get texture(): Texture
    {
        return this._texture;
    }
}

/** The inflated bytes as their own buffer, without walking them when they already fill one. */
const exactBuffer = (bytes: Uint8Array): ArrayBuffer =>
    (bytes.byteOffset === 0) && (bytes.byteLength === bytes.buffer.byteLength)
        ? bytes.buffer as ArrayBuffer
        : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

/**
 * The decoder used when a caller supplies none. {@link AssetManager} passes its own, which knows
 * every format a bundle may carry; this one only has to read the PNG a bundle normally holds, and
 * it does so from a blob. Turning the image into a base64 string first, as this used to, grows it
 * by a third and makes the engine parse a megabytes-long URL.
 */
const decodePngTexture: OctaneBundleTextureDecoder = async bytes =>
{
    const blob = new Blob([ bytes ], { type: 'image/png' });

    if(typeof createImageBitmap === 'function')
    {
        try
        {
            return Texture.from(await createImageBitmap(blob));
        }
        catch
        {
            // Fall through to the image element below.
        }
    }

    const objectUrl = URL.createObjectURL(blob);

    try
    {
        const image = await new Promise<HTMLImageElement>((resolve, reject) =>
        {
            const element = new Image();

            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error('Could not decode the bundle image'));
            element.src = objectUrl;
        });

        return Texture.from(image);
    }
    finally
    {
        URL.revokeObjectURL(objectUrl);
    }
};

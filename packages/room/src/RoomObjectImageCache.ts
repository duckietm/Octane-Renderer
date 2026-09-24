import { IImageResult, IObjectData, IVector3D } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

export interface DisposableTexture { destroyed?: boolean; destroy(destroyBase?: boolean): void; }

export const buildRoomObjectImageKey = (type: string, value: string, direction: IVector3D, scale: number, extras: string | null, objectData: IObjectData | null, state: number, frameCount: number, posture: string | null): string =>
    [ type, value ?? '', `${direction?.x ?? 0},${direction?.y ?? 0},${direction?.z ?? 0}`, scale, extras ?? '', objectData?.getLegacyString() ?? '', state, frameCount, posture ?? '' ].join('|');

/** One cached render: the texture and the single extraction every consumer shares. */
export class RoomObjectImageCacheEntry
{
    private _imagePromise: Promise<HTMLImageElement> | null = null;

    constructor(public readonly texture: Texture) {}

    public getImage(): Promise<HTMLImageElement>
    {
        if(!this._imagePromise)
        {
            this._imagePromise = TextureUtils.generateImage(this.texture).then(image =>
            {
                if(!image) this._imagePromise = null;
                return image;
            });
        }
        return this._imagePromise;
    }

    public destroy(): void
    {
        const texture = this.texture as unknown as DisposableTexture;
        if(texture && !texture.destroyed) texture.destroy(true);
    }
}

/**
 * Bounded LRU of rendered room-object images. Textures stored here are owned
 * by the engine: an evicted or cleared texture is destroyed, so consumers
 * extract or copy what they need as soon as they receive a result.
 */
export class RoomObjectImageCache
{
    private readonly _entries = new Map<string, RoomObjectImageCacheEntry>();

    /** 256 cached renders by default - see the design doc's capacity note. */
    constructor(private readonly _capacity: number = 256) {}

    public get size(): number { return this._entries.size; }

    public get(key: string): RoomObjectImageCacheEntry | undefined
    {
        const entry = this._entries.get(key);
        if(!entry) return undefined;
        this._entries.delete(key);
        this._entries.set(key, entry);
        return entry;
    }

    public set(key: string, texture: Texture): RoomObjectImageCacheEntry
    {
        const existing = this._entries.get(key);
        if(existing) { this._entries.delete(key); if(existing.texture !== texture) existing.destroy(); }
        const entry = new RoomObjectImageCacheEntry(texture);
        this._entries.set(key, entry);
        while(this._entries.size > this._capacity)
        {
            const oldestKey = this._entries.keys().next().value as string;
            const oldest = this._entries.get(oldestKey);
            this._entries.delete(oldestKey);
            oldest?.destroy();
        }
        return entry;
    }

    public clear(): void
    {
        for(const entry of this._entries.values()) entry.destroy();
        this._entries.clear();
    }

    /** Removes and destroys only the entries keyed for `type` (the `type|` key prefix). */
    public clearByType(type: string): void
    {
        const prefix = `${type}|`;

        for(const [ key, entry ] of this._entries)
        {
            if(!key.startsWith(prefix)) continue;

            entry.destroy();
            this._entries.delete(key);
        }
    }
}

/** An IImageResult over a cache entry: every holder of the same entry shares one extraction. */
export class SharedImageResult implements IImageResult
{
    public image: HTMLImageElement = null;
    public readonly data: Texture;

    constructor(private readonly _entry: RoomObjectImageCacheEntry, public id: number = 0)
    {
        this.data = _entry.texture;
    }

    public getImage(): Promise<HTMLImageElement>
    {
        if(this.image) return Promise.resolve(this.image);

        return this._entry.getImage();
    }

    /**
     * The cache owns the texture behind this result, so releasing the result
     * releases nothing: the texture is destroyed when its entry is evicted or
     * the cache is cleared. A plain ImageResult disposes its own texture here.
     */
    public dispose(): void
    {
        this.image = null;
    }
}

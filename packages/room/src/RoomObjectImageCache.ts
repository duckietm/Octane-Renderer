import { IImageResult, IObjectData, IVector3D } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

export interface DisposableTexture { destroyed?: boolean; destroy(destroyBase?: boolean): void; }

export const buildRoomObjectImageKey = (type: string, value: string, direction: IVector3D, scale: number, extras: string | null, objectData: IObjectData | null, state: number, frameCount: number, posture: string | null): string =>
{
    const directionKey = `${direction?.x ?? 0},${direction?.y ?? 0},${direction?.z ?? 0}`;
    const objectDataKey = objectData ? [ objectData.getLegacyString() ] : [ '', '' ];

    return [ type, value ?? '', directionKey, scale, extras ?? '', ...objectDataKey, state, frameCount, posture ?? '' ].join('|');
};

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

    constructor(private readonly _capacity: number = 512) {}

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
}

/** An IImageResult over a cache entry: every holder of the same entry shares one extraction. */
export class SharedImageResult implements IImageResult
{
    public image: HTMLImageElement = null;

    constructor(private readonly _entry: RoomObjectImageCacheEntry, public id: number = 0) {}

    public get data(): Texture { return this._entry.texture; }
    public set data(_value: Texture) { /* the entry owns the texture */ }

    public getImage(): Promise<HTMLImageElement> { return this._entry.getImage(); }
}

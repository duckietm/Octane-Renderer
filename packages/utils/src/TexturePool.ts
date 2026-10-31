import { OctaneLogger, TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

export class TexturePool
{
    private static MAX_IDLE_MS: number = 30000;
    private static SWEEP_INTERVAL_MS: number = 1000;
    private static MAX_POOL_BYTES: number = 64 * 1024 * 1024;

    private _released: { texture: Texture, destroySource: boolean }[] = [];
    private _releasedNext: { texture: Texture, destroySource: boolean }[] = [];

    private _textures: { [index: string]: { [index: string]: Texture[] } } = {};
    private _pooledAt: WeakMap<Texture, number> = new WeakMap();
    private _totalTextures: number = 0;
    private _totalBytes: number = 0;
    private _lastSweepAt: number = 0;

    public getTotalTextures(): number
    {
        let total = 0;
        let bytes = 0;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                for(const texture of this._textures[width][height])
                {
                    total++;
                    bytes += TexturePool.getTextureBytes(texture);
                }
            }
        }

        this._totalTextures = total;
        this._totalBytes = bytes;

        return this._totalTextures;
    }

    public getTotalBytes(): number
    {
        return this._totalBytes;
    }

    public getTexture(width: number, height: number): Texture
    {
        // Only read here: a lookup used to create an empty bucket for every size ever asked for, and run() walked all
        // of them every second for the rest of the session.
        const bucket = this._textures[width]?.[height];

        if(bucket?.length)
        {
            const texture = bucket.shift();

            if(!bucket.length) this.dropBucket(width, height);

            if(texture)
            {
                this._pooledAt.delete(texture);
                this._totalTextures--;
                this._totalBytes -= TexturePool.getTextureBytes(texture);

                return texture;
            }
        }

        return TextureUtils.createRenderTexture(width, height);
    }

    public putTexture(texture: Texture)
    {
        if(!texture || texture.destroyed || !texture.source) return;

        const bytes = TexturePool.getTextureBytes(texture);

        if(bytes > TexturePool.MAX_POOL_BYTES)
        {
            TexturePool.releaseTexture(texture);

            return;
        }

        while((this._totalBytes + bytes) > TexturePool.MAX_POOL_BYTES)
        {
            if(!this.evictOldest()) break;
        }

        if(!this._textures[texture.width]) this._textures[texture.width] = {};

        if(!this._textures[texture.width][texture.height]) this._textures[texture.width][texture.height] = [];

        delete texture.source.hitMap;
        delete texture.source.hitMapDirty;

        this._textures[texture.width][texture.height].push(texture);
        this._pooledAt.set(texture, Date.now());

        this._totalTextures++;
        this._totalBytes += bytes;
    }

    public run(): void
    {
        if(!this._totalTextures) return;

        const now = Date.now();

        if((now - this._lastSweepAt) < TexturePool.SWEEP_INTERVAL_MS) return;

        this._lastSweepAt = now;

        for(const width in this._textures)
        {
            // Held here: dropping the last bucket of a width removes the width from the map while it is walked.
            const heights = this._textures[width];

            for(const height in heights)
            {
                const textures = heights[height];

                for(let i = textures.length - 1; i >= 0; i--)
                {
                    const texture = textures[i];
                    const pooledAt = this._pooledAt.get(texture);

                    if((pooledAt === undefined) || ((now - pooledAt) <= TexturePool.MAX_IDLE_MS)) continue;

                    this.removeAt(textures, i);
                }

                if(!textures.length) this.dropBucket(width, height);
            }
        }
    }

    private dropBucket(width: number | string, height: number | string): void
    {
        const heights = this._textures[width];

        if(!heights) return;

        delete heights[height];

        if(!Object.keys(heights).length) delete this._textures[width];
    }

    /** Visible for tests: the sizes that still hold a bucket. */
    public get bucketCount(): number
    {
        let count = 0;

        for(const width in this._textures) count += Object.keys(this._textures[width]).length;

        return count;
    }

    private evictOldest(): boolean
    {
        let oldestTextures: Texture[] = null;
        let oldestAt = Infinity;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                const textures = this._textures[width][height];

                if(!textures.length) continue;

                const pooledAt = this._pooledAt.get(textures[0]) ?? -Infinity;

                if(pooledAt < oldestAt)
                {
                    oldestAt = pooledAt;
                    oldestTextures = textures;
                }
            }
        }

        if(!oldestTextures) return false;

        this.removeAt(oldestTextures, 0);

        return true;
    }

    private removeAt(textures: Texture[], index: number): void
    {
        const texture = textures[index];

        textures.splice(index, 1);
        this._pooledAt.delete(texture);

        this._totalTextures--;
        this._totalBytes -= TexturePool.getTextureBytes(texture);

        TexturePool.releaseTexture(texture);
    }

    private static releaseTexture(texture: Texture): void
    {
        delete texture.source?.hitMap;
        delete texture.source?.hitMapDirty;

        if(!texture.destroyed) texture.destroy(true);
    }

    private static getTextureBytes(texture: Texture): number
    {
        const width = texture.source?.pixelWidth || texture.width;
        const height = texture.source?.pixelHeight || texture.height;

        return (width * height * 4);
    }

    // Destroyed after the next flush but one: a canvas display may still draw it until it picks up
    // what replaced it (room plane patches).
    public releaseTexture(texture: Texture, destroySource: boolean): void
    {
        if(!texture || texture.destroyed) return;

        delete texture.source?.hitMap;
        delete texture.source?.hitMapDirty;

        this._releasedNext.push({ texture, destroySource });
    }

    // Once per room engine update.
    public flushReleased(): void
    {
        for(const { texture, destroySource } of this._released)
        {
            if(!texture.destroyed) texture.destroy(destroySource);
        }

        this._released = this._releasedNext;
        this._releasedNext = [];
    }

    public get textures(): { [index: string]: { [index: string]: Texture[] } }
    {
        return this._textures;
    }
}

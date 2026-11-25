import { GetTickerTime } from '@octane/utils';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';

export class AvatarImageActionCache
{
    // Directions kept per action. Without the atlas a part still gets a Pixi container the first time a
    // shared frame is drawn from it, and a walking avatar visits all eight directions; the finished frames
    // stay shared in AvatarFrameTextureCache, so three (a head turned either side) is enough.
    public static DEFAULT_MAX_DIRECTIONS: number = 3;
    // With the atlas a part is only a short layer list, so all eight fit: a crowd that redraws less
    // often (see AvatarCompositeBudget) would otherwise rebuild its parts on almost every redraw.
    public static ATLAS_MAX_DIRECTIONS: number = 8;
    // Set by AvatarRenderManager when the atlas is switched on or off; the atlas is on from the start.
    public static MAX_DIRECTIONS: number = AvatarImageActionCache.ATLAS_MAX_DIRECTIONS;

    private _cache: Map<number, AvatarImageDirectionCache>;
    private _lastAccessTime: number;

    constructor()
    {
        this._cache = new Map();

        this.setLastAccessTime(GetTickerTime());
    }

    public dispose(): void
    {
        this.debugInfo('[dispose]');

        if(!this._cache) return;

        for(const direction of this._cache.values())
        {
            if(direction) direction.dispose();
        }

        this._cache.clear();
    }

    public getDirectionCache(direction: number): AvatarImageDirectionCache
    {
        const existing = this._cache.get(direction);

        if(!existing) return null;

        // Most recently used last, so the oldest direction is evicted first. When all eight directions fit,
        // nothing is ever evicted and the lookup needs no reordering.
        if(AvatarImageActionCache.MAX_DIRECTIONS < AvatarImageActionCache.ATLAS_MAX_DIRECTIONS)
        {
            this._cache.delete(direction);
            this._cache.set(direction, existing);
        }

        return existing;
    }

    public updateDirectionCache(direction: number, directionCache: AvatarImageDirectionCache): void
    {
        const existing = this._cache.get(direction);

        if(existing && (existing !== directionCache)) existing.dispose();

        this._cache.delete(direction);
        this._cache.set(direction, directionCache);

        // Safe mid-frame: a body part uses one direction per frame, and this is that part's cache.
        while(this._cache.size > AvatarImageActionCache.MAX_DIRECTIONS)
        {
            const oldestKey = this._cache.keys().next().value;
            const oldest = this._cache.get(oldestKey);

            this._cache.delete(oldestKey);

            if(oldest) oldest.dispose();
        }
    }

    public setLastAccessTime(time: number): void
    {
        this._lastAccessTime = time;
    }

    public getLastAccessTime(): number
    {
        return this._lastAccessTime;
    }

    private debugInfo(message: string): void
    {
    }
}

import { GetTickerTime } from '@octane/utils';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';

export class AvatarImageActionCache
{
    private _cache: Map<string, AvatarImageDirectionCache>;
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
        const existing = this._cache.get(direction.toString());

        if(!existing) return null;

        return existing;
    }

    public updateDirectionCache(direction: number, directionCache: AvatarImageDirectionCache): void
    {
        this._cache.set(direction.toString(), directionCache);
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

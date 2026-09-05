import { IActiveActionData } from '@octane/api';
import { AvatarImageActionCache } from './AvatarImageActionCache';

export class AvatarImageBodyPartCache
{
    private _cache: Map<string, AvatarImageActionCache>;
    private _currentAction: IActiveActionData;
    private _currentDirection: number;
    private _disposed: boolean;

    constructor()
    {
        this._cache = new Map();
    }

    public setAction(action: IActiveActionData, time: number): void
    {
        if(!this._currentAction) this._currentAction = action;

        const actionCache = this.getActionCache(this._currentAction);

        if(actionCache) actionCache.setLastAccessTime(time);

        this._currentAction = action;
    }

    public dispose(): void
    {
        if(!this._disposed)
        {
            if(!this._cache) return;

            this.disposeActions(0, 2147483647);

            this._cache.clear();

            this._cache = null;
            this._disposed = true;
        }
    }

    public disposeActions(maxAge: number, time: number): void
    {
        if(!this._cache || this._disposed) return;

        for(const [key, cache] of this._cache.entries())
        {
            if(!cache) continue;

            const lastAccessTime = cache.getLastAccessTime();

            if((time - lastAccessTime) >= maxAge)
            {
                cache.dispose();

                this._cache.delete(key);
            }
        }
    }

    public getAction(): IActiveActionData
    {
        return this._currentAction;
    }

    public setDirection(direction: number): void
    {
        this._currentDirection = direction;
    }

    public getDirection(): number
    {
        return this._currentDirection;
    }

    public getActionCache(action: IActiveActionData = null): AvatarImageActionCache
    {
        if(!this._currentAction) return null;

        if(!action) action = this._currentAction;

        if(action.overridingAction) return this._cache.get(action.overridingAction);

        return this._cache.get(action.id);
    }

    public updateActionCache(action: IActiveActionData, actionCache: AvatarImageActionCache): void
    {
        if(action.overridingAction) this._cache.set(action.overridingAction, actionCache);
        else this._cache.set(action.id, actionCache);
    }

    private debugInfo(message: string): void
    {
    }
}

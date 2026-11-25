import { IRoomObjectSprite, RoomObjectSpriteData, RoomObjectSpriteType } from '@octane/api';
import { SortableSprite } from '../utils';
import { textureAverageColor } from './AverageColor';
import { RoomObjectCacheItem } from './RoomObjectCacheItem';

export class RoomObjectCache
{
    private static MAX_SIZE_FOR_AVG_COLOR: number = 200;

    // Keyed by object instance id; a string key cost a toString per object per frame.
    private _data: Map<number, RoomObjectCacheItem> = new Map();
    private _roomObjectVariableAccurateZ: string;

    constructor(accurateZ: string)
    {
        this._roomObjectVariableAccurateZ = accurateZ;
    }

    public dispose(): void
    {
        if(this._data)
        {
            for(const [key, item] of this._data.entries())
            {
                if(!item) continue;

                this._data.delete(key);

                item.dispose();
            }

            this._data = null;
        }
    }

    public getObjectCache(id: number): RoomObjectCacheItem
    {
        let existing = this._data.get(id);

        if(!existing)
        {
            existing = new RoomObjectCacheItem(this._roomObjectVariableAccurateZ);

            this._data.set(id, existing);
        }

        return existing;
    }

    public removeObjectCache(id: number): void
    {
        const existing = this._data.get(id);

        if(!existing) return;

        this._data.delete(id);

        existing.dispose();
    }

    // Behaviour from the AIR client (RoomObjectCache.getSortableSpriteList): the drawn sprites as the camera scene
    // names them, by the library asset each one draws (aliases resolved, flipH kept).
    public getSortableSpriteList(): RoomObjectSpriteData[]
    {
        const spriteData: RoomObjectSpriteData[] = [];

        for(const item of this._data.values())
        {
            if(!item) continue;

            const sprites = item.sprites && item.sprites.sprites;

            if(!sprites || !sprites.length) continue;

            for(const sprite of sprites)
            {
                if(!sprite || !sprite.sprite) continue;

                if((sprite.sprite.spriteType === RoomObjectSpriteType.ROOM_PLANE) || !sprite.sprite.libraryAssetName) continue;

                const data = new RoomObjectSpriteData();

                data.objectId = item.objectId;
                data.x = Math.round(sprite.x);
                data.y = Math.round(sprite.y);
                data.z = sprite.z;
                data.name = (sprite.sprite.libraryAssetName || '');
                data.flipH = sprite.sprite.flipH;
                data.alpha = sprite.sprite.alpha;
                data.color = String(sprite.sprite.color);
                data.blendMode = String(sprite.sprite.blendMode);
                data.width = Math.trunc(sprite.sprite.width);
                data.height = Math.trunc(sprite.sprite.height);
                data.type = sprite.sprite.type;
                data.objectType = sprite.sprite.type;
                data.posture = sprite.sprite.posture;

                const isSkewed = this.isSkewedSprite(sprite.sprite);

                if(isSkewed) data.skew = (((sprite.sprite.direction % 4) === 0) ? -0.5 : 0.5);

                // Small skewed thumbnails, library images and group badges are sent with their average colour instead.
                if((isSkewed || (data.name.indexOf('%image.library.url%') >= 0) || (data.name.indexOf('%group.badge.url%') >= 0)) && (data.width <= RoomObjectCache.MAX_SIZE_FOR_AVG_COLOR) && (data.height <= RoomObjectCache.MAX_SIZE_FOR_AVG_COLOR))
                {
                    data.color = String(textureAverageColor(sprite.sprite.texture));

                    if(sprite.sprite.type && (sprite.sprite.type.indexOf('external_image_wallitem') === 0)) data.frame = true;
                }

                spriteData.push(data);
            }
        }

        return spriteData;
    }

    private isSkewedSprite(sprite: IRoomObjectSprite): boolean
    {
        if(!sprite.type) return false;

        if((sprite.type.indexOf('external_image_wallitem') === 0) && (sprite.tag === 'THUMBNAIL')) return true;

        if((sprite.type.indexOf('guild_forum') === 0) && (sprite.tag === 'THUMBNAIL')) return true;

        return false;
    }

    public getPlaneSortableSprites(): SortableSprite[]
    {
        const sprites: SortableSprite[] = [];

        for(const item of this._data.values())
        {
            for(const sprite of item.sprites.sprites)
            {
                if(sprite.sprite.spriteType === RoomObjectSpriteType.ROOM_PLANE) sprites.push(sprite);
            }
        }

        return sprites;
    }
}

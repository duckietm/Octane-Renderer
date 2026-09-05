import { IMessageComposer } from '@octane/api';

export interface ISnowWarEditorItem
{
    name: string;
    x: number;
    y: number;
    rotation: number;
    imageUrl: string;
    offsetZ: number;
    state: number;
}

/**
 * Publishes an arena layout designed in the in-game WYSIWYG editor back to
 * the server (room_models.public_items + heightmap). Payload:
 *   int    mapId
 *   int    itemCount
 *   repeat { string name, int x, int y, int rotation, string imageUrl, int offsetZ, int state }
 *   int    spawnCount
 *   repeat { int x, int y }
 *   int    heightmapRowCount
 *   repeat { string row }
 *   string arenaName
 */
export class SnowWarSaveEditorComposer implements IMessageComposer<(string | number)[]>
{
    private _data: (string | number)[];

    constructor(
        mapId: number,
        items: ISnowWarEditorItem[],
        spawns: { x: number; y: number }[],
        heightmap: string[],
        arenaName: string)
    {
        const data: (string | number)[] = [ mapId, items.length ];

        for(const item of items)
        {
            data.push(item.name, item.x, item.y, item.rotation, item.imageUrl ?? '', item.offsetZ ?? 0, item.state ?? 0);
        }

        data.push(spawns.length);

        for(const spawn of spawns)
        {
            data.push(spawn.x, spawn.y);
        }

        data.push(heightmap.length);

        for(const row of heightmap)
        {
            data.push(row);
        }

        data.push(arenaName);

        this._data = data;
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray(): (string | number)[]
    {
        return this._data;
    }
}

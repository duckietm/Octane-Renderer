interface ListFixtureEditorItem
{
    name: string;
    x: number;
}

class ThreeListsComposerFixture
{
    private _data: (string | number)[];

    constructor(mapId: number, items: ListFixtureEditorItem[], spawns: { x: number; y: number }[], heightmap: string[], arenaName: string)
    {
        const data: (string | number)[] = [ mapId, items.length ];

        for(const item of items)
        {
            data.push(item.name, item.x);
        }

        data.push(spawns.length);
        for(const spawn of spawns) data.push(spawn.x, spawn.y);

        data.push(heightmap.length);
        for(const row of heightmap) data.push(row);

        data.push(arenaName);
        this._data = data;
    }

    public getMessageArray()
    {
        return this._data;
    }
}

import { IMessageComposer } from '@octane/api';

type SoundboardCatalogUpsertData = [ number, string, string, number, boolean, string ];

export class SoundboardCatalogUpsertComposer implements IMessageComposer<SoundboardCatalogUpsertData>
{
    private readonly _data: SoundboardCatalogUpsertData;

    /**
     * `classname` keys the pad to gamedata/SoundData.json and is what
     * management should send; `url` stays for clips hosted outside the asset
     * tree. The server accepts one or the other, and reads the trailing
     * classname only when it is present.
     */
    constructor(id: number, name: string, url: string, minRank: number, enabled: boolean, classname: string = '')
    {
        this._data = [ id, name, url, minRank, enabled, classname ];
    }

    public getMessageArray(): SoundboardCatalogUpsertData
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

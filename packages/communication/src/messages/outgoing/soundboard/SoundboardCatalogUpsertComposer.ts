import { IMessageComposer } from '@octane/api';

type SoundboardCatalogUpsertData = [ number, string, string, number, boolean, string, number ];

/** Sent as the cooldown by a caller that does not manage it: an update keeps the stored value. */
export const SOUNDBOARD_KEEP_COOLDOWN = -1;

export class SoundboardCatalogUpsertComposer implements IMessageComposer<SoundboardCatalogUpsertData>
{
    private readonly _data: SoundboardCatalogUpsertData;

    /**
     * `classname` keys the pad to gamedata/SoundData.json and is what
     * management should send; `url` stays for clips hosted outside the asset
     * tree. The server accepts one or the other, and reads the trailing
     * classname only when it is present.
     *
     * `cooldownSeconds` is the wait before one player may play the same pad
     * again, 0 for none. The server reads it only when present, after the
     * classname.
     */
    constructor(
        id: number,
        name: string,
        url: string,
        minRank: number,
        enabled: boolean,
        classname: string = '',
        cooldownSeconds: number = SOUNDBOARD_KEEP_COOLDOWN
    )
    {
        this._data = [ id, name, url, minRank, enabled, classname, cooldownSeconds ];
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

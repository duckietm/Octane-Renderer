import { IMessageComposer } from '@octane/api';

export class SetYoutubeDisplayPlaylistMessageComposer implements IMessageComposer<ConstructorParameters<typeof SetYoutubeDisplayPlaylistMessageComposer>>
{
    private _data: ConstructorParameters<typeof SetYoutubeDisplayPlaylistMessageComposer>;

    constructor(itemId: number, playlistId: string)
    {
        this._data = [itemId, playlistId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

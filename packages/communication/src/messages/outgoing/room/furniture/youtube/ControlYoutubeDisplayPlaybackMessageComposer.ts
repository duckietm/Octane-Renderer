import { IMessageComposer } from '@octane/api';

export class ControlYoutubeDisplayPlaybackMessageComposer implements IMessageComposer<ConstructorParameters<typeof ControlYoutubeDisplayPlaybackMessageComposer>>
{
    private _data: ConstructorParameters<typeof ControlYoutubeDisplayPlaybackMessageComposer>;

    constructor(itemId: number, command: number)
    {
        this._data = [itemId, command];
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

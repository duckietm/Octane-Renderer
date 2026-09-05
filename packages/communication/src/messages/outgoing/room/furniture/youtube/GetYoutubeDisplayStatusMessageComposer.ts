import { IMessageComposer } from '@octane/api';

export class GetYoutubeDisplayStatusMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetYoutubeDisplayStatusMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetYoutubeDisplayStatusMessageComposer>;

    constructor(itemId: number)
    {
        this._data = [itemId];
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

import { IMessageComposer } from '@octane/api';

export class GuideSessionCreateMessageComposer implements IMessageComposer<ConstructorParameters<typeof GuideSessionCreateMessageComposer>>
{
    private _data: ConstructorParameters<typeof GuideSessionCreateMessageComposer>;

    constructor(requestType: number, message: string)
    {
        this._data = [requestType, message];
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

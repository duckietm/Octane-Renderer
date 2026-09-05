import { IMessageComposer } from '@octane/api';

export class GetIsBadgeRequestFulfilledComposer implements IMessageComposer<ConstructorParameters<typeof GetIsBadgeRequestFulfilledComposer>>
{
    private _data: ConstructorParameters<typeof GetIsBadgeRequestFulfilledComposer>;

    constructor(badgeCode: string)
    {
        this._data = [ badgeCode ];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}

import { IMessageComposer } from '@octane/api';

export class ForwardToSomeRoomMessageComposer implements IMessageComposer<ConstructorParameters<typeof ForwardToSomeRoomMessageComposer>>
{
    private _data: ConstructorParameters<typeof ForwardToSomeRoomMessageComposer>;

    constructor(forwardData: string)
    {
        this._data = [forwardData];
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

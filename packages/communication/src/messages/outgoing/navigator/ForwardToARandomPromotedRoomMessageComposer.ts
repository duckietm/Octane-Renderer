import { IMessageComposer } from '@octane/api';

export class ForwardToARandomPromotedRoomMessageComposer implements IMessageComposer<ConstructorParameters<typeof ForwardToARandomPromotedRoomMessageComposer>>
{
    private _data: ConstructorParameters<typeof ForwardToARandomPromotedRoomMessageComposer>;

    constructor(category: string)
    {
        this._data = [category];
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

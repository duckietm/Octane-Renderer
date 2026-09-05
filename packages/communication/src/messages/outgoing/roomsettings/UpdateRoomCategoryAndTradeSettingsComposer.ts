import { IMessageComposer } from '@octane/api';

export class UpdateRoomCategoryAndTradeSettingsComposer implements IMessageComposer<ConstructorParameters<typeof UpdateRoomCategoryAndTradeSettingsComposer>>
{
    private _data: ConstructorParameters<typeof UpdateRoomCategoryAndTradeSettingsComposer>;

    constructor(roomId: number, categoryId: number, tradeType: number)
    {
        this._data = [roomId, categoryId, tradeType];
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

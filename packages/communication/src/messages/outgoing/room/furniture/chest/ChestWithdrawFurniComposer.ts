import { IMessageComposer } from '@octane/api';

/**
 * Player withdraws stored furni (official Dul wire shape):
 * [chestItemId, isWallItem, typeId, legacyPosterId, amount]. amount < 0 = all matching rows.
 */
export class ChestWithdrawFurniComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawFurniComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawFurniComposer>;

    constructor(chestItemId: number, isWallItem: boolean, typeId: number, legacyPosterId: string, amount: number)
    {
        this._data = [chestItemId, isWallItem, typeId, legacyPosterId, amount];
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

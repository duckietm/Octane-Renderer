import { IMessageComposer } from '@octane/api';

/** Withdraw all furni from a wired furni chest (official Vefehonuj wire shape): [chestItemId]. Header 9326. */
export class ChestWithdrawAllFurniComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawAllFurniComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawAllFurniComposer>;

    constructor(chestItemId: number)
    {
        this._data = [chestItemId];
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

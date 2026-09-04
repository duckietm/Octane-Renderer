import { IMessageComposer } from '@nitrots/api';

export class HotelViewLandingVoteComposer implements IMessageComposer<number[]>
{
    private _data: number[];

    constructor(slotId: number, optionId: number)
    {
        this._data = [slotId, optionId];
    }

    public getMessageArray(): number[]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}

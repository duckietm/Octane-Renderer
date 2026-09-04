import { IMessageComposer } from '@nitrots/api';

export interface IWheelAdminPrizeEdit
{
    id: number;
    type: string;
    value: string;
    amount: number;
    pointsType: number;
    weight: number;
    label: string;
}

export class WheelAdminSavePrizesComposer implements IMessageComposer<(number | string)[]>
{
    private _data: (number | string)[];

    constructor(prizes: IWheelAdminPrizeEdit[])
    {
        const data: (number | string)[] = [ prizes.length ];

        for(const prize of prizes)
        {
            data.push(prize.id, prize.type, prize.value, prize.amount, prize.pointsType, prize.weight, prize.label);
        }

        this._data = data;
    }

    public getMessageArray(): (number | string)[]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}

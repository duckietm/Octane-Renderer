import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWheelAdminPrize
{
    id: number;
    type: string;
    value: string;
    amount: number;
    pointsType: number;
    weight: number;
    label: string;
}

export class WheelAdminPrizesParser implements IMessageParser
{
    private _prizes: IWheelAdminPrize[] = [];

    public flush(): boolean
    {
        this._prizes = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._prizes = [];

        for(let i = 0; i < count; i++)
        {
            this._prizes.push({
                id: wrapper.readInt(),
                type: wrapper.readString(),
                value: wrapper.readString(),
                amount: wrapper.readInt(),
                pointsType: wrapper.readInt(),
                weight: wrapper.readInt(),
                label: wrapper.readString()
            });
        }

        return true;
    }

    public get prizes(): IWheelAdminPrize[]
    {
        return this._prizes;
    }
}

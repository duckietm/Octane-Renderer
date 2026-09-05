import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWheelPrize
{
    id: number;
    type: string; // item | badge | credits | points | spin | nothing
    spriteId: number; // item only (furni icon), else 0
    badgeCode: string; // badge only, else ''
    amount: number;
    pointsType: number;
    label: string;
}

export class WheelDataParser implements IMessageParser
{
    private _freeSpins: number = 0;
    private _extraSpins: number = 0;
    private _spinCost: number = 0;
    private _spinCostType: number = 0;
    private _prizes: IWheelPrize[] = [];

    public flush(): boolean
    {
        this._freeSpins = 0;
        this._extraSpins = 0;
        this._spinCost = 0;
        this._spinCostType = 0;
        this._prizes = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._freeSpins = wrapper.readInt();
        this._extraSpins = wrapper.readInt();
        this._spinCost = wrapper.readInt();
        this._spinCostType = wrapper.readInt();

        const count = wrapper.readInt();
        this._prizes = [];

        for(let i = 0; i < count; i++)
        {
            this._prizes.push({
                id: wrapper.readInt(),
                type: wrapper.readString(),
                spriteId: wrapper.readInt(),
                badgeCode: wrapper.readString(),
                amount: wrapper.readInt(),
                pointsType: wrapper.readInt(),
                label: wrapper.readString()
            });
        }

        return true;
    }

    public get freeSpins(): number
    {
        return this._freeSpins;
    }
    public get extraSpins(): number
    {
        return this._extraSpins;
    }
    public get spinCost(): number
    {
        return this._spinCost;
    }
    public get spinCostType(): number
    {
        return this._spinCostType;
    }
    public get prizes(): IWheelPrize[]
    {
        return this._prizes;
    }
}

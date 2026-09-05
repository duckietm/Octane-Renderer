import { IMessageDataWrapper } from '@octane/api';

export class SnowWarMachineData
{
    private _objectId: number;
    private _x: number;
    private _y: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._objectId = wrapper.readInt();
        this._x = wrapper.readInt();
        this._y = wrapper.readInt();
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get x(): number
    {
        return this._x;
    }

    public get y(): number
    {
        return this._y;
    }
}

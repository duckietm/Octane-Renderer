import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class RoomUnitHabbiconParser implements IMessageParser
{
    private _unitId: number;
    private _habbiconId: number;

    public flush(): boolean
    {
        this._unitId = -1;
        this._habbiconId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._unitId = wrapper.readInt();
        this._habbiconId = wrapper.readInt();

        return true;
    }

    public get unitId(): number
    {
        return this._unitId;
    }

    public get habbiconId(): number
    {
        return this._habbiconId;
    }
}

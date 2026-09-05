import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class WheelResultParser implements IMessageParser
{
    private _prizeId: number = 0;

    public flush(): boolean
    {
        this._prizeId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._prizeId = wrapper.readInt();

        return true;
    }

    public get prizeId(): number
    {
        return this._prizeId;
    }
}

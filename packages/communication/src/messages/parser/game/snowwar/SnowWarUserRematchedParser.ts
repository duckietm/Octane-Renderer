import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarUserRematchedParser implements IMessageParser
{
    private _userId: number;

    public flush(): boolean
    {
        this._userId = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();

        return true;
    }

    public get userId(): number
    {
        return this._userId;
    }
}

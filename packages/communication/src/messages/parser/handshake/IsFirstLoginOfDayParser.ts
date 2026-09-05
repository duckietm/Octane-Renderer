import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class IsFirstLoginOfDayParser implements IMessageParser
{
    private _isFirstLoginOfDay: boolean;

    public flush(): boolean
    {
        this._isFirstLoginOfDay = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._isFirstLoginOfDay = wrapper.readBoolean();

        return true;
    }

    public get isFirstLoginOfDay(): boolean
    {
        return this._isFirstLoginOfDay;
    }
}

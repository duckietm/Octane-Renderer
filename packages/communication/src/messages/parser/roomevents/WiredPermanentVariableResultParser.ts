import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Official result (2425) of a permanent-variable change in the holder detail window. */
export class WiredPermanentVariableResultParser implements IMessageParser
{
    private _success: boolean;

    public flush(): boolean
    {
        this._success = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._success = wrapper.readBoolean();

        return true;
    }

    public get success(): boolean
    {
        return this._success;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** WiredMenuError (289): the wired menu refused an action; the code says why. */
export class WiredMenuErrorParser implements IMessageParser
{
    /** Only the owner of the variable may do this. The one code the official client announces. */
    public static NOT_VARIABLE_OWNER: number = 7;

    private _errorCode: number;

    public flush(): boolean
    {
        this._errorCode = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errorCode = wrapper.readShort();

        return true;
    }

    public get errorCode(): number
    {
        return this._errorCode;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class TraxEditorErrorParser implements IMessageParser
{
    public static ERROR_DISABLED = 1;
    public static ERROR_LIMIT_REACHED = 2;
    public static ERROR_NOT_ENOUGH_CURRENCY = 3;
    public static ERROR_INVALID_DATA = 4;
    public static ERROR_NOT_FOUND = 5;

    private _errorCode: number = 0;

    public flush(): boolean
    {
        this._errorCode = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errorCode = wrapper.readInt();

        return true;
    }

    public get errorCode(): number
    {
        return this._errorCode;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class ConsoleReadReceiptParser implements IMessageParser
{
    private _readerId: number;

    public flush(): boolean
    {
        this._readerId = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._readerId = wrapper.readInt();

        return true;
    }

    public get readerId(): number
    {
        return this._readerId;
    }
}

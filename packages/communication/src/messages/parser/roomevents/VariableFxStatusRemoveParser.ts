import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class VariableFxStatusRemoveParser implements IMessageParser
{
    private _statusKeys: string[];

    public flush(): boolean
    {
        this._statusKeys = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._statusKeys = [];

        let totalStatuses = wrapper.readInt();

        while(totalStatuses > 0)
        {
            this._statusKeys.push(wrapper.readString());

            totalStatuses--;
        }

        return true;
    }

    public get statusKeys(): string[]
    {
        return this._statusKeys;
    }
}

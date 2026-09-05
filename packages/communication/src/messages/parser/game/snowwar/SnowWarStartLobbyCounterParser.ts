import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarStartLobbyCounterParser implements IMessageParser
{
    private _secondsUntilStart: number;

    public flush(): boolean
    {
        this._secondsUntilStart = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._secondsUntilStart = wrapper.readInt();

        return true;
    }

    public get secondsUntilStart(): number
    {
        return this._secondsUntilStart;
    }
}

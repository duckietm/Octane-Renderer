import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarOnStageRunningParser implements IMessageParser
{
    private _totalSecondsLeft: number;

    public flush(): boolean
    {
        this._totalSecondsLeft = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._totalSecondsLeft = wrapper.readInt();

        return true;
    }

    public get totalSecondsLeft(): number
    {
        return this._totalSecondsLeft;
    }
}

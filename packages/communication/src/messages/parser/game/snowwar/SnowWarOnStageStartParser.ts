import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarOnStageStartParser implements IMessageParser
{
    private _preparingSeconds: number;

    public flush(): boolean
    {
        this._preparingSeconds = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._preparingSeconds = wrapper.readInt();

        return true;
    }

    public get preparingSeconds(): number
    {
        return this._preparingSeconds;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SoundboardPlayDeniedParser implements IMessageParser
{
    private _reason = 0;
    private _remainingSeconds = 0;

    public flush(): boolean
    {
        this._reason = 0;
        this._remainingSeconds = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._reason = wrapper.readInt();
        this._remainingSeconds = Math.max(0, wrapper.readInt());

        return true;
    }

    public get reason(): number
    {
        return this._reason;
    }

    public get remainingSeconds(): number
    {
        return this._remainingSeconds;
    }
}

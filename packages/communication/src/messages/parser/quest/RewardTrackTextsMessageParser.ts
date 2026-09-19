import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** RewardTrackTexts (10109): full localization keys with their values. */
export class RewardTrackTextsMessageParser implements IMessageParser
{
    private _texts: Map<string, string>;

    public flush(): boolean
    {
        this._texts = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const key = wrapper.readString();

            this._texts.set(key, wrapper.readString());
        }

        return true;
    }

    public get texts(): Map<string, string>
    {
        return this._texts;
    }
}

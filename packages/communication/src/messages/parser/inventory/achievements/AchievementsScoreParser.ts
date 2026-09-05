import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class AchievementsScoreParser implements IMessageParser
{
    private _score: number;

    public flush(): boolean
    {
        this._score = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._score = wrapper.readInt();

        return true;
    }

    public get score(): number
    {
        return this._score;
    }
}

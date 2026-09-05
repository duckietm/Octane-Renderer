import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { AchievementData } from './AchievementData';

export class AchievementParser implements IMessageParser
{
    private _achievement: AchievementData;

    public flush(): boolean
    {
        this._achievement = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._achievement = new AchievementData(wrapper);

        return true;
    }

    public get achievement(): AchievementData
    {
        return this._achievement;
    }
}

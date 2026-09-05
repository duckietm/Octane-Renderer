import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { AchievementData } from './AchievementData';

export class AchievementsParser implements IMessageParser
{
    private _achievements: AchievementData[];
    private _defaultCategory: string;

    public flush(): boolean
    {
        this._achievements = [];
        this._defaultCategory = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._achievements = [];

        let totalCount = wrapper.readInt();

        while(totalCount > 0)
        {
            this._achievements.push(new AchievementData(wrapper));

            totalCount--;
        }

        this._defaultCategory = wrapper.readString();

        return true;
    }

    public get achievements(): AchievementData[]
    {
        return this._achievements;
    }

    public get defaultCategory(): string
    {
        return this._defaultCategory;
    }
}

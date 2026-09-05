import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { GameAchievementData } from './GameAchievementData';

export class GameAchievementsMessageParser implements IMessageParser
{
    private _achievements:GameAchievementData[];

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._achievements = [];
        const count = wrapper.readInt();
        let i = 0;
        while(i < count)
        {
            const gameTypeId = wrapper.readInt();
            const achievementCount = wrapper.readInt();
            let j = 0;
            while(j < achievementCount)
            {
                const achievementId = wrapper.readInt();
                const achievementName = wrapper.readString();
                const levels = wrapper.readInt();
                this._achievements.push(new GameAchievementData(gameTypeId, achievementId, achievementName, levels));
                j++;
            }
            i++;
        }

        return true;
    }

    public get achievements():GameAchievementData[]
    {
        return this._achievements;
    }
}

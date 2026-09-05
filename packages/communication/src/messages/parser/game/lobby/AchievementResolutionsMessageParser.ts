import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { AchievementResolutionData } from '../../inventory';

export class AchievementResolutionsMessageParser implements IMessageParser
{
    private _stuffId:number;
    private _achievements:AchievementResolutionData[];
    private _endTime:number;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._stuffId = wrapper.readInt();
        const count = wrapper.readInt();
        let i = 0;
        while(i < count)
        {
            this._achievements.push(new AchievementResolutionData(wrapper));
            i++;
        }
        this._endTime = wrapper.readInt();

        return true;
    }

    public get stuffId():number
    {
        return this._stuffId;
    }

    public get achievements():AchievementResolutionData[]
    {
        return this._achievements;
    }

    public get endTime():number
    {
        return this._endTime;
    }
}

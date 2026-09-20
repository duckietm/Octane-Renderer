import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IProfileAchievementEntry
{
    badgeCode: string;
    level: number;
    levelCount: number;
    points: number;
}

/** The highest achievements of the user an extended profile shows, best first. */
export class ProfileAchievementsParser implements IMessageParser
{
    private _userId: number;
    private _entries: IProfileAchievementEntry[];

    public flush(): boolean
    {
        this._userId = 0;
        this._entries = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._entries.push({
                badgeCode: wrapper.readString(),
                level: wrapper.readInt(),
                levelCount: wrapper.readInt(),
                points: wrapper.readInt()
            });
        }

        return true;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get entries(): IProfileAchievementEntry[]
    {
        return this._entries;
    }
}

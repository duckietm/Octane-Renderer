import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class YouTubeRoomWatchersParser implements IMessageParser
{
    private _watcherIds: number[];

    public flush(): boolean
    {
        this._watcherIds = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._watcherIds = [];
        for(let i = 0; i < count; i++)
        {
            this._watcherIds.push(wrapper.readInt());
        }
        return true;
    }

    public get watcherIds(): number[]
    {
        return this._watcherIds;
    }
}

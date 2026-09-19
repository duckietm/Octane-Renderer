import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { readRewardTrackAdminTrack, RewardTrackAdminTrack } from './RewardTrackAdminData';

/** RewardTrackAdminData (10100): the choices the editor may pick from, then every stored track. */
export class RewardTrackAdminDataMessageParser implements IMessageParser
{
    private _actionTypes: string[];
    private _rewardTypes: string[];
    private _tracks: RewardTrackAdminTrack[];

    public flush(): boolean
    {
        this._actionTypes = [];
        this._rewardTypes = [];
        this._tracks = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const actionTypeCount = wrapper.readInt();

        for(let i = 0; i < actionTypeCount; i++) this._actionTypes.push(wrapper.readString());

        const rewardTypeCount = wrapper.readInt();

        for(let i = 0; i < rewardTypeCount; i++) this._rewardTypes.push(wrapper.readString());

        const trackCount = wrapper.readInt();

        for(let i = 0; i < trackCount; i++) this._tracks.push(readRewardTrackAdminTrack(wrapper));

        return true;
    }

    public get actionTypes(): string[]
    {
        return this._actionTypes;
    }

    public get rewardTypes(): string[]
    {
        return this._rewardTypes;
    }

    public get tracks(): RewardTrackAdminTrack[]
    {
        return this._tracks;
    }
}

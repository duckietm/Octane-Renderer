import { IMessageDataWrapper } from '@octane/api';

/** A task level as stored. */
export interface RewardTrackAdminLevel
{
    requiredCount: number;
    pointsReward: number;
    premium: boolean;
}

/** A task as stored: the action name, its parameter and the levels in order. */
export interface RewardTrackAdminTask
{
    id: string;
    actionType: string;
    parameter: string;
    premium: boolean;
    sortOrder: number;
    levels: RewardTrackAdminLevel[];
}

/** A prize as stored. */
export interface RewardTrackAdminPrize
{
    id: string;
    requiredPoints: number;
    productItemTypeId: number;
    rewardType: string;
    extraParams: string;
    rewardAmount: number;
    premium: boolean;
    sortOrder: number;
    /** How many users claimed it. */
    claimedCount: number;
}

/** A track as stored, disabled ones included. The premium boost is in hundredths: 150 is 1.5x. */
export interface RewardTrackAdminTrack
{
    id: string;
    theme: string;
    sortOrder: number;
    startsAt: number;
    endsAt: number;
    hasPremium: boolean;
    premiumBoostPercent: number;
    premiumInstantPoints: number;
    premiumCostDiamonds: number;
    premiumCostCredits: number;
    enabled: boolean;
    tasks: RewardTrackAdminTask[];
    prizes: RewardTrackAdminPrize[];
    /** The localization texts, keyed by the part after "reward_track.<track>.". */
    texts: Record<string, string>;
}

export const readRewardTrackAdminTrack = (wrapper: IMessageDataWrapper): RewardTrackAdminTrack =>
{
    const track: RewardTrackAdminTrack = {
        id: wrapper.readString(),
        theme: wrapper.readString(),
        sortOrder: wrapper.readInt(),
        startsAt: wrapper.readInt(),
        endsAt: wrapper.readInt(),
        hasPremium: wrapper.readBoolean(),
        premiumBoostPercent: wrapper.readInt(),
        premiumInstantPoints: wrapper.readInt(),
        premiumCostDiamonds: wrapper.readInt(),
        premiumCostCredits: wrapper.readInt(),
        enabled: wrapper.readBoolean(),
        tasks: [],
        prizes: [],
        texts: {}
    };

    const taskCount = wrapper.readInt();

    for(let i = 0; i < taskCount; i++)
    {
        const task: RewardTrackAdminTask = {
            id: wrapper.readString(),
            actionType: wrapper.readString(),
            parameter: wrapper.readString(),
            premium: wrapper.readBoolean(),
            sortOrder: wrapper.readInt(),
            levels: []
        };

        const levelCount = wrapper.readInt();

        for(let j = 0; j < levelCount; j++)
        {
            task.levels.push({
                requiredCount: wrapper.readInt(),
                pointsReward: wrapper.readInt(),
                premium: wrapper.readBoolean()
            });
        }

        track.tasks.push(task);
    }

    const prizeCount = wrapper.readInt();

    for(let i = 0; i < prizeCount; i++)
    {
        track.prizes.push({
            id: wrapper.readString(),
            requiredPoints: wrapper.readInt(),
            productItemTypeId: wrapper.readInt(),
            rewardType: wrapper.readString(),
            extraParams: wrapper.readString(),
            rewardAmount: wrapper.readInt(),
            premium: wrapper.readBoolean(),
            sortOrder: wrapper.readInt(),
            claimedCount: wrapper.readInt()
        });
    }

    const textCount = wrapper.readInt();

    for(let i = 0; i < textCount; i++)
    {
        const key = wrapper.readString();

        track.texts[key] = wrapper.readString();
    }

    return track;
};

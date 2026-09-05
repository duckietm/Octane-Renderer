import { IMessageDataWrapper } from '@octane/api';

export class ScrKickbackData
{
    private _currentHcStreak: number;
    private _firstSubscriptionDate: string;
    private _kickbackPercentage: number;
    private _totalCreditsMissed: number;
    private _totalCreditsRewarded: number;
    private _totalCreditsSpent: number;
    private _creditRewardForStreakBonus: number;
    private _creditRewardForMonthlySpent: number;
    private _timeUntilPayday: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._currentHcStreak = wrapper.readInt();
        this._firstSubscriptionDate = wrapper.readString();
        this._kickbackPercentage = wrapper.readDouble();
        this._totalCreditsMissed = wrapper.readInt();
        this._totalCreditsRewarded = wrapper.readInt();
        this._totalCreditsSpent = wrapper.readInt();
        this._creditRewardForStreakBonus = wrapper.readInt();
        this._creditRewardForMonthlySpent = wrapper.readInt();
        this._timeUntilPayday = wrapper.readInt();
    }

    public get currentHcStreak(): number
    {
        return this._currentHcStreak;
    }

    public get firstSubscriptionDate(): string
    {
        return this._firstSubscriptionDate;
    }

    public get kickbackPercentage(): number
    {
        return this._kickbackPercentage;
    }

    public get totalCreditsMissed(): number
    {
        return this._totalCreditsMissed;
    }

    public get totalCreditsRewarded(): number
    {
        return this._totalCreditsRewarded;
    }

    public get totalCreditsSpent(): number
    {
        return this._totalCreditsSpent;
    }

    public get creditRewardForStreakBonus(): number
    {
        return this._creditRewardForStreakBonus;
    }

    public get creditRewardForMonthlySpent(): number
    {
        return this._creditRewardForMonthlySpent;
    }

    public get timeUntilPayday(): number
    {
        return this._timeUntilPayday;
    }
}

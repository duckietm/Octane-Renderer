import { IMessageDataWrapper } from '@octane/api';

/** What an opened calendar day held, as Octane servers send it per opened day in the calendar data. */
export class CampaignCalendarReward
{
    public productName = '';
    public customImage = '';
    public furnitureClassName = '';
    public badgeCode = '';
    public credits = 0;
    public pixels = 0;
    public points = 0;
    public pointsType = 0;
    public subscriptionType = '';
    public subscriptionDays = 0;

    public static parse(wrapper: IMessageDataWrapper): CampaignCalendarReward
    {
        const reward = new CampaignCalendarReward();

        reward.productName = wrapper.readString();
        reward.customImage = wrapper.readString();
        reward.furnitureClassName = wrapper.readString();
        reward.badgeCode = wrapper.readString();
        reward.credits = wrapper.readInt();
        reward.pixels = wrapper.readInt();
        reward.points = wrapper.readInt();
        reward.pointsType = wrapper.readInt();
        reward.subscriptionType = wrapper.readString();
        reward.subscriptionDays = wrapper.readInt();

        return reward;
    }
}

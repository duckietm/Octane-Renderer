import { IMessageComposer } from '@octane/api';

export class OpenCampaignCalendarDoorAsStaffComposer implements IMessageComposer<ConstructorParameters<typeof OpenCampaignCalendarDoorAsStaffComposer>>
{
    private _data: ConstructorParameters<typeof OpenCampaignCalendarDoorAsStaffComposer>;

    constructor(campaignName: string, doorId: number)
    {
        this._data = [campaignName, doorId];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}

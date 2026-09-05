import { IMessageComposer } from '@octane/api';

export class OpenCampaignCalendarDoorComposer implements IMessageComposer<ConstructorParameters<typeof OpenCampaignCalendarDoorComposer>>
{
    private _data: ConstructorParameters<typeof OpenCampaignCalendarDoorComposer>;

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

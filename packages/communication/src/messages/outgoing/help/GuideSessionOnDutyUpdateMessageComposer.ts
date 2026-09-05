import { IMessageComposer } from '@octane/api';

export class GuideSessionOnDutyUpdateMessageComposer implements IMessageComposer<ConstructorParameters<typeof GuideSessionOnDutyUpdateMessageComposer>>
{
    private _data: ConstructorParameters<typeof GuideSessionOnDutyUpdateMessageComposer>;

    constructor(isOnDuty: boolean, isHandlingGuideRequests: boolean, isHandlingHelpRequests: boolean, isHandlingBullyReports: boolean)
    {
        this._data = [isOnDuty, isHandlingGuideRequests, isHandlingHelpRequests, isHandlingBullyReports];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

import { IMessageComposer } from '@octane/api';

export class GuideSessionFeedbackMessageComposer implements IMessageComposer<ConstructorParameters<typeof GuideSessionFeedbackMessageComposer>>
{
    private _data: ConstructorParameters<typeof GuideSessionFeedbackMessageComposer>;

    constructor(wasHelpful: boolean)
    {
        this._data = [wasHelpful];
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

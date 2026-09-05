import { IMessageComposer } from '@octane/api';

export class GuideSessionGuideDecidesMessageComposer implements IMessageComposer<ConstructorParameters<typeof GuideSessionGuideDecidesMessageComposer>>
{
    private _data: ConstructorParameters<typeof GuideSessionGuideDecidesMessageComposer>;

    constructor(accept: boolean)
    {
        this._data = [accept];
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

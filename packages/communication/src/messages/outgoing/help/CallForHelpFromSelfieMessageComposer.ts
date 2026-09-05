import { IMessageComposer } from '@octane/api';

export class CallForHelpFromSelfieMessageComposer implements IMessageComposer<ConstructorParameters<typeof CallForHelpFromSelfieMessageComposer>>
{
    private _data: ConstructorParameters<typeof CallForHelpFromSelfieMessageComposer>;

    constructor(extraData: string, roomId: number, reportedUserId: number, message: string, roomObjectId: number)
    {
        this._data = [extraData, roomId, reportedUserId, message, roomObjectId];
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

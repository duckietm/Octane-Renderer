import { IMessageComposer } from '@octane/api';

export class AcceptGameInviteMessageComposer implements IMessageComposer<ConstructorParameters<typeof AcceptGameInviteMessageComposer>>
{
    private _data: ConstructorParameters<typeof AcceptGameInviteMessageComposer>;

    constructor(gameTypeId:number, inviterId:number)
    {
        this._data = [ gameTypeId, inviterId ];
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

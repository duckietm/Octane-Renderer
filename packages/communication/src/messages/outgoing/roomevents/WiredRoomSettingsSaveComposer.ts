import { IMessageComposer } from '@octane/api';

export class WiredRoomSettingsSaveComposer implements IMessageComposer<ConstructorParameters<typeof WiredRoomSettingsSaveComposer>>
{
    private _data: ConstructorParameters<typeof WiredRoomSettingsSaveComposer>;

    constructor(inspectMask: number, modifyMask: number)
    {
        this._data = [ inspectMask, modifyMask ];
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

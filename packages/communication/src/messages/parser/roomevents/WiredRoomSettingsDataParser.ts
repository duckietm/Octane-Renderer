import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class WiredRoomSettingsDataParser implements IMessageParser
{
    private _roomId: number;
    private _inspectMask: number;
    private _modifyMask: number;
    private _canInspect: boolean;
    private _canModify: boolean;
    private _canManageSettings: boolean;

    public flush(): boolean
    {
        this._roomId = 0;
        this._inspectMask = 0;
        this._modifyMask = 0;
        this._canInspect = false;
        this._canModify = false;
        this._canManageSettings = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._inspectMask = wrapper.readInt();
        this._modifyMask = wrapper.readInt();
        this._canInspect = wrapper.readBoolean();
        this._canModify = wrapper.readBoolean();
        this._canManageSettings = wrapper.readBoolean();

        return true;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get inspectMask(): number
    {
        return this._inspectMask;
    }

    public get modifyMask(): number
    {
        return this._modifyMask;
    }

    public get canInspect(): boolean
    {
        return this._canInspect;
    }

    public get canModify(): boolean
    {
        return this._canModify;
    }

    public get canManageSettings(): boolean
    {
        return this._canManageSettings;
    }
}

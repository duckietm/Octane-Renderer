import { OctaneEvent } from './core';

export class OctaneSettingsEvent extends OctaneEvent
{
    public static SETTINGS_UPDATED: string = 'NSE_SETTINGS_UPDATED';

    private _volumeSystem: number;
    private _volumeFurni: number;
    private _volumeTrax: number;
    private _volumeSoundboard: number = 80;
    private _oldChat: boolean;
    private _roomInvites: boolean;
    private _cameraFollow: boolean;
    private _flags: number;
    private _chatType: number;
    private _onlineStatusVisible: boolean;
    private _friendsCanFollow: boolean;
    private _friendRequestsAllowed: boolean;

    constructor()
    {
        super(OctaneSettingsEvent.SETTINGS_UPDATED);
    }

    public clone(): OctaneSettingsEvent
    {
        const clone = new OctaneSettingsEvent();

        clone._volumeSystem = this._volumeSystem;
        clone._volumeFurni = this._volumeFurni;
        clone._volumeTrax = this._volumeTrax;
        clone._volumeSoundboard = this._volumeSoundboard;
        clone._oldChat = this._oldChat;
        clone._roomInvites = this._roomInvites;
        clone._cameraFollow = this._cameraFollow;
        clone._flags = this._flags;
        clone._chatType = this._chatType;
        clone._onlineStatusVisible = this._onlineStatusVisible;
        clone._friendsCanFollow = this._friendsCanFollow;
        clone._friendRequestsAllowed = this._friendRequestsAllowed;

        return clone;
    }

    public get volumeSystem(): number
    {
        return this._volumeSystem;
    }

    public set volumeSystem(volume: number)
    {
        this._volumeSystem = volume;
    }

    public get volumeFurni(): number
    {
        return this._volumeFurni;
    }

    public set volumeFurni(volume: number)
    {
        this._volumeFurni = volume;
    }

    public get volumeTrax(): number
    {
        return this._volumeTrax;
    }

    public set volumeTrax(volume: number)
    {
        this._volumeTrax = volume;
    }

    public get volumeSoundboard(): number
    {
        return this._volumeSoundboard;
    }

    public set volumeSoundboard(volume: number)
    {
        this._volumeSoundboard = volume;
    }

    public get oldChat(): boolean
    {
        return this._oldChat;
    }

    public set oldChat(value: boolean)
    {
        this._oldChat = value;
    }

    public get roomInvites(): boolean
    {
        return this._roomInvites;
    }

    public set roomInvites(value: boolean)
    {
        this._roomInvites = value;
    }

    public get cameraFollow(): boolean
    {
        return this._cameraFollow;
    }

    public set cameraFollow(value: boolean)
    {
        this._cameraFollow = value;
    }

    public get flags(): number
    {
        return this._flags;
    }

    public set flags(flags: number)
    {
        this._flags = flags;
    }

    public get chatType(): number
    {
        return this._chatType;
    }

    public set chatType(type: number)
    {
        this._chatType = type;
    }

    public get onlineStatusVisible(): boolean
    {
        return this._onlineStatusVisible;
    }

    public set onlineStatusVisible(value: boolean)
    {
        this._onlineStatusVisible = value;
    }

    public get friendsCanFollow(): boolean
    {
        return this._friendsCanFollow;
    }

    public set friendsCanFollow(value: boolean)
    {
        this._friendsCanFollow = value;
    }

    public get friendRequestsAllowed(): boolean
    {
        return this._friendRequestsAllowed;
    }

    public set friendRequestsAllowed(value: boolean)
    {
        this._friendRequestsAllowed = value;
    }
}

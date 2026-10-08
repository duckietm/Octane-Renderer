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
    private _profileVisible: boolean = true;
    private _wiredWhisperDisabled: boolean = false;
    private _chatMode: number = 0;
    private _chatBubbleWidth: number = 1;
    private _chatScrollSpeed: number = 1;

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
        clone._profileVisible = this._profileVisible;
        clone._wiredWhisperDisabled = this._wiredWhisperDisabled;
        clone._chatMode = this._chatMode;
        clone._chatBubbleWidth = this._chatBubbleWidth;
        clone._chatScrollSpeed = this._chatScrollSpeed;

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

    /** Whether other users see the full extended profile. */
    public get profileVisible(): boolean
    {
        return this._profileVisible;
    }

    public set profileVisible(value: boolean)
    {
        this._profileVisible = value;
    }

    public get wiredWhisperDisabled(): boolean
    {
        return this._wiredWhisperDisabled;
    }

    public set wiredWhisperDisabled(value: boolean)
    {
        this._wiredWhisperDisabled = value;
    }

    /** 0 free flow, 1 line by line (RoomChatSettings.CHAT_MODE_*). */
    public get chatMode(): number
    {
        return this._chatMode;
    }

    public set chatMode(value: number)
    {
        this._chatMode = value;
    }

    /** 0 wide, 1 normal, 2 thin (RoomChatSettings.CHAT_BUBBLE_WIDTH_*). */
    public get chatBubbleWidth(): number
    {
        return this._chatBubbleWidth;
    }

    public set chatBubbleWidth(value: number)
    {
        this._chatBubbleWidth = value;
    }

    /** 0 fast, 1 normal, 2 slow (RoomChatSettings.CHAT_SCROLL_SPEED_*). */
    public get chatScrollSpeed(): number
    {
        return this._chatScrollSpeed;
    }

    public set chatScrollSpeed(value: number)
    {
        this._chatScrollSpeed = value;
    }
}

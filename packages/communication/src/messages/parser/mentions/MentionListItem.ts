import { IMessageDataWrapper } from '@nitrots/api';

export class MentionListItem
{
    private _mentionId: number;
    private _senderId: number;
    private _senderUsername: string;
    private _senderFigure: string;
    private _roomId: number;
    private _roomName: string;
    private _message: string;
    private _mentionType: number;
    private _timestamp: number;
    private _read: boolean;

    constructor(wrapper: IMessageDataWrapper, withReadFlag: boolean)
    {
        this._mentionId = wrapper.readInt();
        this._senderId = wrapper.readInt();
        this._senderUsername = wrapper.readString();
        // Wire order: sender_figure sits between username and roomId. The
        // server composer writes it unconditionally; an empty string is
        // produced for legacy rows where the column wasn't loaded.
        this._senderFigure = wrapper.readString();
        this._roomId = wrapper.readInt();
        this._roomName = wrapper.readString();
        this._message = wrapper.readString();
        this._mentionType = wrapper.readInt();
        this._timestamp = wrapper.readInt();
        this._read = withReadFlag ? wrapper.readBoolean() : false;
    }

    public get mentionId(): number
    {
        return this._mentionId;
    }
    public get senderId(): number
    {
        return this._senderId;
    }
    public get senderUsername(): string
    {
        return this._senderUsername;
    }
    public get senderFigure(): string
    {
        return this._senderFigure;
    }
    public get roomId(): number
    {
        return this._roomId;
    }
    public get roomName(): string
    {
        return this._roomName;
    }
    public get message(): string
    {
        return this._message;
    }
    public get mentionType(): number
    {
        return this._mentionType;
    }
    public get timestamp(): number
    {
        return this._timestamp;
    }
    public get read(): boolean
    {
        return this._read;
    }
}

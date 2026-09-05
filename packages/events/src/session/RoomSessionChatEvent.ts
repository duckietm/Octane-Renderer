import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionChatEvent extends RoomSessionEvent
{
    public static CHAT_EVENT: string = 'RSCE_CHAT_EVENT';
    public static FLOOD_EVENT: string = 'RSCE_FLOOD_EVENT';

    public static CHAT_TYPE_SPEAK: number = 0;
    public static CHAT_TYPE_WHISPER: number = 1;
    public static CHAT_TYPE_SHOUT: number = 2;
    public static CHAT_TYPE_RESPECT: number = 3;
    public static CHAT_TYPE_PETRESPECT: number = 4;
    public static CHAT_TYPE_HAND_ITEM_RECEIVED: number = 5;
    public static CHAT_TYPE_PETTREAT: number = 6;
    public static CHAT_TYPE_PETREVIVE: number = 7;
    public static CHAT_TYPE_PET_REBREED_FERTILIZE: number = 8;
    public static CHAT_TYPE_PET_SPEED_FERTILIZE: number = 9;
    public static CHAT_TYPE_MUTE_REMAINING: number = 10;

    private _objectId: number;
    private _message: string;
    private _chatType: number;
    private _chatColours: string;
    private _links: string[];
    private _extraParam: number;
    private _style: number;
    private _prefixText: string;
    private _prefixColor: string;
    private _prefixIcon: string;
    private _prefixEffect: string;
    private _prefixFont: string;
    private _nickIcon: string;
    private _displayOrder: string;

    constructor(type: string, session: IRoomSession, objectId: number, message: string, chatType: number, style: number = 0, chatColours: string = '', links: string[] = null, extraParam: number = -1, prefixText: string = '', prefixColor: string = '', prefixIcon: string = '', prefixEffect: string = '', prefixFont: string = '', nickIcon: string = '', displayOrder: string = 'icon-prefix-name')
    {
        super(type, session);

        this._objectId = objectId;
        this._message = message;
        this._chatType = chatType;
        this._chatColours = chatColours;
        this._links = links;
        this._extraParam = extraParam;
        this._style = style;
        this._prefixText = prefixText;
        this._prefixColor = prefixColor;
        this._prefixIcon = prefixIcon;
        this._prefixEffect = prefixEffect;
        this._prefixFont = prefixFont;
        this._nickIcon = nickIcon;
        this._displayOrder = displayOrder;
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get message(): string
    {
        return this._message;
    }

    public get chatType(): number
    {
        return this._chatType;
    }

    public get links(): string[]
    {
        return this._links;
    }

    public get extraParam(): number
    {
        return this._extraParam;
    }

    public get style(): number
    {
        return this._style;
    }

    public get chatColours(): string
    {
        return this._chatColours;
    }

    public get prefixText(): string
    {
        return this._prefixText;
    }

    public get prefixColor(): string
    {
        return this._prefixColor;
    }

    public get prefixIcon(): string
    {
        return this._prefixIcon;
    }

    public get prefixEffect(): string
    {
        return this._prefixEffect;
    }

    public get prefixFont(): string
    {
        return this._prefixFont;
    }

    public get nickIcon(): string
    {
        return this._nickIcon;
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }
}

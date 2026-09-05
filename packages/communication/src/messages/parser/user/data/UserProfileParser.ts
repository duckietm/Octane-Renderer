import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HabboGroupEntryData } from '../HabboGroupEntryData';

export class UserProfileParser implements IMessageParser
{
    private _id: number;
    private _username: string;
    private _figure: string;
    private _motto: string;
    private _registration: string;
    private _achievementPoints: number;
    private _friendsCount: number;
    private _isMyFriend: boolean;
    private _requestSent: boolean;
    private _isOnline: boolean;
    private _groups: HabboGroupEntryData[];
    private _secondsSinceLastVisit: number;
    private _openProfileWindow: boolean;
    private _backgroundId: number;
    private _standId: number;
    private _overlayId: number;
    private _cardBackgroundId: number;
    private _totalBadges: number;
    private _nickIcon: string;
    private _prefixText: string;
    private _prefixColor: string;
    private _prefixIcon: string;
    private _prefixEffect: string;
    private _prefixFont: string;
    private _displayOrder: string;

    public flush(): boolean
    {
        this._id = 0;
        this._username = null;
        this._figure = null;
        this._motto = null;
        this._registration = null;
        this._achievementPoints = 0;
        this._friendsCount = 0;
        this._isMyFriend = false;
        this._requestSent = false;
        this._isOnline = false;
        this._groups = [];
        this._secondsSinceLastVisit = 0;
        this._openProfileWindow = false;
        this._backgroundId = 0;
        this._standId = 0;
        this._overlayId = 0;
        this._cardBackgroundId = 0;
        this._totalBadges = 0;
        this._nickIcon = '';
        this._prefixText = '';
        this._prefixColor = '';
        this._prefixIcon = '';
        this._prefixEffect = '';
        this._prefixFont = '';
        this._displayOrder = 'icon-prefix-name';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._id = wrapper.readInt();
        this._username = wrapper.readString();
        this._figure = wrapper.readString();
        this._motto = wrapper.readString();
        this._registration = wrapper.readString();
        this._achievementPoints = wrapper.readInt();
        this._friendsCount = wrapper.readInt();
        this._isMyFriend = wrapper.readBoolean();
        this._requestSent = wrapper.readBoolean();
        this._isOnline = wrapper.readBoolean();
        const groupsCount = wrapper.readInt();

        for(let i = 0; i < groupsCount; i++)
        {
            this._groups.push(new HabboGroupEntryData(wrapper));
        }

        this._secondsSinceLastVisit = wrapper.readInt();
        this._openProfileWindow = wrapper.readBoolean();

        // Optional trailing blocks, one tier per emulator release:
        //   block 1: background / stand / overlay (3 ints)
        //   block 2: card background (1 int)
        //   block 3: nick icon (1 string)
        //   block 4: prefix decoration set (6 strings)
        //   block 5: total badge count (1 int)
        // Each tier early-returns to keep the parser tolerant of older
        // servers that don't ship the later blocks. Defaults set by flush().
        if(!wrapper.bytesAvailable) return true;

        this._backgroundId = wrapper.readInt();
        this._standId = wrapper.readInt();
        this._overlayId = wrapper.readInt();

        if(!wrapper.bytesAvailable) return true;

        this._cardBackgroundId = wrapper.readInt();

        if(!wrapper.bytesAvailable) return true;

        this._nickIcon = wrapper.readString();

        if(!wrapper.bytesAvailable) return true;

        this._prefixText = wrapper.readString();
        this._prefixColor = wrapper.readString();
        this._prefixIcon = wrapper.readString();
        this._prefixEffect = wrapper.readString();
        this._prefixFont = wrapper.readString();
        this._displayOrder = wrapper.readString();

        if(!wrapper.bytesAvailable) return true;

        this._totalBadges = wrapper.readInt();

        return true;
    }

    public get id(): number
    {
        return this._id;
    }

    public get username(): string
    {
        return this._username;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get motto(): string
    {
        return this._motto;
    }

    public get registration(): string
    {
        return this._registration;
    }

    public get achievementPoints(): number
    {
        return this._achievementPoints;
    }

    public get friendsCount(): number
    {
        return this._friendsCount;
    }

    public get isMyFriend(): boolean
    {
        return this._isMyFriend;
    }

    public get requestSent(): boolean
    {
        return this._requestSent;
    }

    public get isOnline(): boolean
    {
        return this._isOnline;
    }

    public get groups(): HabboGroupEntryData[]
    {
        return this._groups;
    }

    public get secondsSinceLastVisit(): number
    {
        return this._secondsSinceLastVisit;
    }

    public get openProfileWindow(): boolean
    {
        return this._openProfileWindow;
    }

    public get backgroundId(): number
    {
        return this._backgroundId;
    }

    public get standId(): number
    {
        return this._standId;
    }

    public get overlayId(): number
    {
        return this._overlayId;
    }

    public get cardBackgroundId(): number
    {
        return this._cardBackgroundId;
    }

    public get totalBadges(): number
    {
        return this._totalBadges;
    }

    public get nickIcon(): string
    {
        return this._nickIcon;
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

    public get displayOrder(): string
    {
        return this._displayOrder;
    }
}

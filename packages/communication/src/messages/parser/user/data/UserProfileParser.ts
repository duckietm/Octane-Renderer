import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HabboGroupEntryData } from '../HabboGroupEntryData';

export class UserProfileParser implements IMessageParser
{
    /** Banner, uploads and theme, as the server reports them; all on for an older server. */
    public static readonly ALL_FEATURES = 7;
    /** The way the avatar faces in the profile picture when the server does not say. */
    public static readonly DEFAULT_AVATAR_DIRECTION = 2;

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
    private _onlineStatus: number;
    private _level: number;
    private _nextLevelStart: number;
    private _isHidden: boolean;
    private _borderId: number;
    private _bannerId: number;
    private _accentId: number;
    private _bannerImage: string;
    private _backgroundImage: string;
    private _backgroundStyle: string;
    private _features: number;
    private _avatarDirection: number;
    private _avatarOffsetX: number;
    private _avatarOffsetY: number;

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
        this._onlineStatus = -1;
        this._level = 0;
        this._nextLevelStart = 0;
        this._isHidden = false;
        this._borderId = 0;
        this._bannerId = 0;
        this._accentId = 0;
        this._bannerImage = '';
        this._backgroundImage = '';
        this._backgroundStyle = '';
        this._features = UserProfileParser.ALL_FEATURES;
        this._avatarDirection = UserProfileParser.DEFAULT_AVATAR_DIRECTION;
        this._avatarOffsetX = 0;
        this._avatarOffsetY = 0;

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

        // Presence and level block: 1 online, 0 offline, 2 hidden (sent only to the user themself),
        // then the account level and the score the next level starts at. -1 / 0 when absent.
        if(!wrapper.bytesAvailable) return true;

        this._onlineStatus = wrapper.readInt();
        this._level = wrapper.readInt();
        this._nextLevelStart = wrapper.readInt();

        // Official isHidden: the owner hides the full profile from everybody else.
        if(!wrapper.bytesAvailable) return true;

        this._isHidden = wrapper.readBoolean();

        // Profile window customisation: the infostand border, the banner from the gallery and the
        // accent colour from the palette. 0 when absent or not chosen.
        if(!wrapper.bytesAvailable) return true;

        this._borderId = wrapper.readInt();
        this._bannerId = wrapper.readInt();
        this._accentId = wrapper.readInt();

        // Uploaded pictures: the file names of the banner and of the window background, '' when none.
        if(!wrapper.bytesAvailable) return true;

        this._bannerImage = wrapper.readString();
        this._backgroundImage = wrapper.readString();

        // The owner's own background ("rrggbb;rrggbb;angle;pattern", '' when none), then which profile features
        // the hotel has on (banner 1, uploads 2, theme 4). A server that sends neither has them all on.
        if(!wrapper.bytesAvailable) return true;

        this._backgroundStyle = wrapper.readString();
        this._features = wrapper.readInt();

        // The avatar's pose in the profile picture: the direction it faces (0-7), then how far it is moved in the
        // box (x, y in pixels). 2, 0, 0 when absent: the look of an older server.
        if(!wrapper.bytesAvailable) return true;

        this._avatarDirection = wrapper.readInt();
        this._avatarOffsetX = wrapper.readInt();
        this._avatarOffsetY = wrapper.readInt();

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

    /** 1 online, 0 offline, 2 hidden (own profile only); -1 when the server does not send it. */
    public get onlineStatus(): number
    {
        return this._onlineStatus;
    }

    /** The account level; 0 when the server does not send it. */
    public get level(): number
    {
        return this._level;
    }

    /** The achievement score the next level starts at; 0 when the server does not send it. */
    public get nextLevelStart(): number
    {
        return this._nextLevelStart;
    }

    /** The owner hides the full profile from other users; false when the server does not send it. */
    public get isHidden(): boolean
    {
        return this._isHidden;
    }

    public get borderId(): number
    {
        return this._borderId;
    }

    public get bannerId(): number
    {
        return this._bannerId;
    }

    public get accentId(): number
    {
        return this._accentId;
    }

    public get bannerImage(): string
    {
        return this._bannerImage;
    }

    public get backgroundImage(): string
    {
        return this._backgroundImage;
    }

    public get backgroundStyle(): string
    {
        return this._backgroundStyle;
    }

    public get features(): number
    {
        return this._features;
    }

    /** The direction the avatar faces in the profile picture, 0-7; 2 when the server does not send it. */
    public get avatarDirection(): number
    {
        return this._avatarDirection;
    }

    /** How far the avatar is moved right in the profile picture, in pixels; 0 when the server does not send it. */
    public get avatarOffsetX(): number
    {
        return this._avatarOffsetX;
    }

    /** How far the avatar is moved down in the profile picture, in pixels; 0 when the server does not send it. */
    public get avatarOffsetY(): number
    {
        return this._avatarOffsetY;
    }
}

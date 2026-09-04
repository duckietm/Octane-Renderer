export class UserMessageData
{
    public static M: string = 'M';
    public static F: string = 'F';

    private _roomIndex: number = 0;
    private _x: number = 0;
    private _y: number = 0;
    private _z: number = 0;
    private _dir: number = 0;
    private _name: string = '';
    private _userType: number = 0;
    private _sex: string = '';
    private _figure: string = '';
    private _custom: string = '';
    private _nickIcon: string = '';
    private _prefixText: string = '';
    private _prefixColor: string = '';
    private _prefixIcon: string = '';
    private _prefixEffect: string = '';
    private _prefixFont: string = '';
    private _displayOrder: string = 'icon-prefix-name';
    private _activityPoints: number = 0;
    private _background: number = 0;
    private _stand: number = 0;
    private _overlay: number = 0;
    private _cardBackground: number = 0;
    private _webID: number = 0;
    private _groupID: number = 0;
    private _groupStatus: number = 0;
    private _groupName: string = '';
    private _subType: string = '';
    private _ownerId: number = 0;
    private _ownerName: string = '';
    private _rarityLevel: number = 0;
    private _hasSaddle: boolean = false;
    private _isRiding: boolean = false;
    private _canBreed: boolean = false;
    private _canHarvest: boolean = false;
    private _canRevive: boolean = false;
    private _hasBreedingPermission: boolean = false;
    private _petLevel: number = 0;
    private _petPosture: string = '';
    private _botSkills: number[] = [];
    private _isModerator: boolean = false;
    private _roomEntryMethod: string = 'unknown';
    private _roomEntryTeleportId: number = 0;
    private _borderId: number = 0;
    private _isReadOnly: boolean = false;

    constructor(roomIndex: number)
    {
        this._roomIndex = roomIndex;
    }

    public setReadOnly(): void
    {
        this._isReadOnly = true;
    }

    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    public get x(): number
    {
        return this._x;
    }

    public set x(value: number)
    {
        if(!this._isReadOnly)
        {
            this._x = value;
        }
    }

    public get y(): number
    {
        return this._y;
    }

    public set y(value: number)
    {
        if(!this._isReadOnly)
        {
            this._y = value;
        }
    }

    public get z(): number
    {
        return this._z;
    }

    public set z(value: number)
    {
        if(!this._isReadOnly)
        {
            this._z = value;
        }
    }

    public get dir(): number
    {
        return this._dir;
    }

    public set dir(value: number)
    {
        if(!this._isReadOnly)
        {
            this._dir = value;
        }
    }

    public get name(): string
    {
        return this._name;
    }

    public set name(value: string)
    {
        if(!this._isReadOnly)
        {
            this._name = value;
        }
    }

    public get userType(): number
    {
        return this._userType;
    }

    public set userType(value: number)
    {
        if(!this._isReadOnly)
        {
            this._userType = value;
        }
    }

    public get sex(): string
    {
        return this._sex;
    }

    public set sex(value: string)
    {
        if(!this._isReadOnly)
        {
            this._sex = value;
        }
    }

    public get figure(): string
    {
        return this._figure;
    }

    public set figure(value: string)
    {
        if(!this._isReadOnly)
        {
            this._figure = value;
        }
    }

    public get custom(): string
    {
        return this._custom;
    }

    public set custom(value: string)
    {
        if(!this._isReadOnly)
        {
            this._custom = value;
        }
    }

    public get activityPoints(): number
    {
        return this._activityPoints;
    }

    public set activityPoints(value: number)
    {
        if(!this._isReadOnly)
        {
            this._activityPoints = value;
        }
    }

    public get background(): number
    {
        return this._background;
    }

    public set background(value: number)
    {
        this._background = value;
    }

    public get stand(): number
    {
        return this._stand;
    }

    public set stand(value: number)
    {
        this._stand = value;
    }

    public get overlay(): number
    {
        return this._overlay;
    }

    public set overlay(value: number)
    {
        this._overlay = value;
    }

    public get cardBackground(): number
    {
        return this._cardBackground;
    }

    public set cardBackground(value: number)
    {
        this._cardBackground = value;
    }

    public get webID(): number
    {
        return this._webID;
    }

    public set webID(value: number)
    {
        if(!this._isReadOnly)
        {
            this._webID = value;
        }
    }

    public get groupID(): number
    {
        return this._groupID;
    }

    public set groupID(groupId: number)
    {
        if(!this._isReadOnly)
        {
            this._groupID = groupId;
        }
    }

    public get groupName(): string
    {
        return this._groupName;
    }

    public set groupName(value: string)
    {
        if(!this._isReadOnly)
        {
            this._groupName = value;
        }
    }

    public get groupStatus(): number
    {
        return this._groupStatus;
    }

    public set groupStatus(value: number)
    {
        if(!this._isReadOnly)
        {
            this._groupStatus = value;
        }
    }

    public get subType(): string
    {
        return this._subType;
    }

    public set subType(value: string)
    {
        if(!this._isReadOnly)
        {
            this._subType = value;
        }
    }

    public get ownerId(): number
    {
        return this._ownerId;
    }

    public set ownerId(value: number)
    {
        if(!this._isReadOnly)
        {
            this._ownerId = value;
        }
    }

    public get ownerName(): string
    {
        return this._ownerName;
    }

    public set ownerName(value: string)
    {
        if(!this._isReadOnly)
        {
            this._ownerName = value;
        }
    }

    public get rarityLevel(): number
    {
        return this._rarityLevel;
    }

    public set rarityLevel(value: number)
    {
        if(!this._isReadOnly)
        {
            this._rarityLevel = value;
        }
    }

    public get hasSaddle(): boolean
    {
        return this._hasSaddle;
    }

    public set hasSaddle(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._hasSaddle = value;
        }
    }

    public get isRiding(): boolean
    {
        return this._isRiding;
    }

    public set isRiding(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._isRiding = value;
        }
    }

    public get canBreed(): boolean
    {
        return this._canBreed;
    }

    public set canBreed(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._canBreed = value;
        }
    }

    public get canHarvest(): boolean
    {
        return this._canHarvest;
    }

    public set canHarvest(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._canHarvest = value;
        }
    }

    public get canRevive(): boolean
    {
        return this._canRevive;
    }

    public set canRevive(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._canRevive = value;
        }
    }

    public get hasBreedingPermission(): boolean
    {
        return this._hasBreedingPermission;
    }

    public set hasBreedingPermission(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._hasBreedingPermission = value;
        }
    }

    public get petLevel(): number
    {
        return this._petLevel;
    }

    public set petLevel(value: number)
    {
        if(!this._isReadOnly)
        {
            this._petLevel = value;
        }
    }

    public get petPosture(): string
    {
        return this._petPosture;
    }

    public set petPosture(value: string)
    {
        if(!this._isReadOnly)
        {
            this._petPosture = value;
        }
    }

    public get botSkills(): number[]
    {
        return this._botSkills;
    }

    public set botSkills(value: number[])
    {
        this._botSkills = value;
    }

    public get isModerator(): boolean
    {
        return this._isModerator;
    }

    public get nickIcon(): string
    {
        return this._nickIcon;
    }

    public set nickIcon(value: string)
    {
        if(!this._isReadOnly)
        {
            this._nickIcon = value;
        }
    }

    public get prefixText(): string
    {
        return this._prefixText;
    }

    public set prefixText(value: string)
    {
        if(!this._isReadOnly)
        {
            this._prefixText = value;
        }
    }

    public get prefixColor(): string
    {
        return this._prefixColor;
    }

    public set prefixColor(value: string)
    {
        if(!this._isReadOnly)
        {
            this._prefixColor = value;
        }
    }

    public get prefixIcon(): string
    {
        return this._prefixIcon;
    }

    public set prefixIcon(value: string)
    {
        if(!this._isReadOnly)
        {
            this._prefixIcon = value;
        }
    }

    public get prefixEffect(): string
    {
        return this._prefixEffect;
    }

    public set prefixEffect(value: string)
    {
        if(!this._isReadOnly)
        {
            this._prefixEffect = value;
        }
    }

    public get prefixFont(): string
    {
        return this._prefixFont;
    }

    public set prefixFont(value: string)
    {
        if(!this._isReadOnly)
        {
            this._prefixFont = value;
        }
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }

    public set displayOrder(value: string)
    {
        if(!this._isReadOnly)
        {
            this._displayOrder = value;
        }
    }

    public set isModerator(value: boolean)
    {
        if(!this._isReadOnly)
        {
            this._isModerator = value;
        }
    }

    public get roomEntryMethod(): string
    {
        return this._roomEntryMethod;
    }

    public set roomEntryMethod(value: string)
    {
        if(!this._isReadOnly)
        {
            this._roomEntryMethod = value;
        }
    }

    public get roomEntryTeleportId(): number
    {
        return this._roomEntryTeleportId;
    }

    public set roomEntryTeleportId(value: number)
    {
        if(!this._isReadOnly)
        {
            this._roomEntryTeleportId = value;
        }
    }

    public get borderId(): number
    {
        return this._borderId;
    }

    public set borderId(value: number)
    {
        if(!this._isReadOnly)
        {
            this._borderId = value;
        }
    }
}

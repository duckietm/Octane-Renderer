import { IRoomUserData } from '@octane/api';

export class RoomUserData implements IRoomUserData
{
    private _roomIndex: number = -1;
    private _name: string = '';
    private _type: number = 0;
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
    private _activityPoints: number;
    private _background: number;
    private _stand: number;
    private _overlay: number;
    private _cardBackground: number;
    private _borderId: number = 0;
    private _webID: number = 0;
    private _groupID: number = 0;
    private _groupStatus: number = 0;
    private _groupName: string = '';
    private _ownerId: number = 0;
    private _ownerName: string = '';
    private _petLevel: number = 0;
    private _rarityLevel: number = 0;
    private _hasSaddle: boolean;
    private _isRiding: boolean;
    private _canBreed: boolean;
    private _canHarvest: boolean;
    private _canRevive: boolean;
    private _hasBreedingPermission: boolean;
    private _botSkills: number[];
    private _isModerator: boolean;
    private _roomEntryMethod: string = 'unknown';
    private _roomEntryTeleportId: number = 0;

    constructor(roomIndex: number)
    {
        this._roomIndex = roomIndex;
    }

    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    public get activityPoints(): number
    {
        return this._activityPoints;
    }

    public set activityPoints(value: number)
    {
        this._activityPoints = value;
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

    public get borderId(): number
    {
        return this._borderId;
    }

    public set borderId(value: number)
    {
        this._borderId = value;
    }

    public get name(): string
    {
        return this._name;
    }

    public set name(value: string)
    {
        this._name = value;
    }

    public get type(): number
    {
        return this._type;
    }

    public set type(value: number)
    {
        this._type = value;
    }

    public get sex(): string
    {
        return this._sex;
    }

    public set sex(value: string)
    {
        this._sex = value;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public set figure(value: string)
    {
        this._figure = value;
    }

    public get custom(): string
    {
        return this._custom;
    }

    public set custom(value: string)
    {
        this._custom = value;
    }

    public get webID(): number
    {
        return this._webID;
    }

    public set webID(value: number)
    {
        this._webID = value;
    }

    public get groupId(): number
    {
        return this._groupID;
    }

    public set groupId(groupId: number)
    {
        this._groupID = groupId;
    }

    public get groupName(): string
    {
        return this._groupName;
    }

    public set groupName(value: string)
    {
        this._groupName = value;
    }

    public get groupStatus(): number
    {
        return this._groupStatus;
    }

    public set groupStatus(value: number)
    {
        this._groupStatus = value;
    }

    public get ownerId(): number
    {
        return this._ownerId;
    }

    public set ownerId(value: number)
    {
        this._ownerId = value;
    }

    public get ownerName(): string
    {
        return this._ownerName;
    }

    public set ownerName(value: string)
    {
        this._ownerName = value;
    }

    public get rarityLevel(): number
    {
        return this._rarityLevel;
    }

    public set rarityLevel(value: number)
    {
        this._rarityLevel = value;
    }

    public get hasSaddle(): boolean
    {
        return this._hasSaddle;
    }

    public set hasSaddle(value: boolean)
    {
        this._hasSaddle = value;
    }

    public get isRiding(): boolean
    {
        return this._isRiding;
    }

    public set isRiding(value: boolean)
    {
        this._isRiding = value;
    }

    public get canBreed(): boolean
    {
        return this._canBreed;
    }

    public set canBreed(value: boolean)
    {
        this._canBreed = value;
    }

    public get canHarvest(): boolean
    {
        return this._canHarvest;
    }

    public set canHarvest(value: boolean)
    {
        this._canHarvest = value;
    }

    public get canRevive(): boolean
    {
        return this._canRevive;
    }

    public set canRevive(value: boolean)
    {
        this._canRevive = value;
    }

    public get hasBreedingPermission(): boolean
    {
        return this._hasBreedingPermission;
    }

    public set hasBreedingPermission(value: boolean)
    {
        this._hasBreedingPermission = value;
    }

    public get petLevel(): number
    {
        return this._petLevel;
    }

    public set petLevel(value: number)
    {
        this._petLevel = value;
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
        this._nickIcon = value;
    }

    public get prefixText(): string
    {
        return this._prefixText;
    }

    public set prefixText(value: string)
    {
        this._prefixText = value;
    }

    public get prefixColor(): string
    {
        return this._prefixColor;
    }

    public set prefixColor(value: string)
    {
        this._prefixColor = value;
    }

    public get prefixIcon(): string
    {
        return this._prefixIcon;
    }

    public set prefixIcon(value: string)
    {
        this._prefixIcon = value;
    }

    public get prefixEffect(): string
    {
        return this._prefixEffect;
    }

    public set prefixEffect(value: string)
    {
        this._prefixEffect = value;
    }

    public get prefixFont(): string
    {
        return this._prefixFont;
    }

    public set prefixFont(value: string)
    {
        this._prefixFont = value;
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }

    public set displayOrder(value: string)
    {
        this._displayOrder = value;
    }

    public set isModerator(value: boolean)
    {
        this._isModerator = value;
    }

    public get roomEntryMethod(): string
    {
        return this._roomEntryMethod;
    }

    public set roomEntryMethod(value: string)
    {
        this._roomEntryMethod = value;
    }

    public get roomEntryTeleportId(): number
    {
        return this._roomEntryTeleportId;
    }

    public set roomEntryTeleportId(value: number)
    {
        this._roomEntryTeleportId = value;
    }
}

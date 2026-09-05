import { IMessageDataWrapper } from '@octane/api';

export class SnowWarGameObjectData
{
    public static OBJECT_TYPE_AVATAR = 1;
    public static OBJECT_TYPE_SNOWBALL = 2;
    public static OBJECT_TYPE_MACHINE = 3;
    public static OBJECT_TYPE_TREE = 4;
    public static OBJECT_TYPE_PILE = 5;

    private _objectType: number;
    private _objectId: number = -1;

    // avatar fields
    private _worldX: number = 0;
    private _worldY: number = 0;
    private _rotation: number = 0;
    private _health: number = 0;
    private _snowballCount: number = 0;
    private _isBot: number = 0;
    private _activityTimer: number = 0;
    private _activityState: number = 0;
    private _nextGoalX: number = 0;
    private _nextGoalY: number = 0;
    private _walkGoalX: number = 0;
    private _walkGoalY: number = 0;
    private _score: number = 0;
    private _userId: number = 0;
    private _teamId: number = 0;
    private _name: string = '';
    private _motto: string = '';
    private _figure: string = '';
    private _gender: string = '';

    // snowball fields
    private _locH: number = 0;
    private _locV: number = 0;
    private _height: number = 0;
    private _direction: number = 0;
    private _trajectory: number = 0;
    private _timeToLive: number = 0;
    private _throwerObjectId: number = 0;
    private _parabolaOffset: number = 0;
    private _maximumHits: number = 0;
    private _hits: number = 0;
    private _maxSnowballs: number = 0;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._objectType = wrapper.readInt();

        switch(this._objectType)
        {
            case SnowWarGameObjectData.OBJECT_TYPE_AVATAR:
                this._objectId = wrapper.readInt();
                this._worldX = wrapper.readInt();
                this._worldY = wrapper.readInt();
                this._rotation = wrapper.readInt();
                this._health = wrapper.readInt();
                this._snowballCount = wrapper.readInt();
                this._isBot = wrapper.readInt();
                this._activityTimer = wrapper.readInt();
                this._activityState = wrapper.readInt();
                this._nextGoalX = wrapper.readInt();
                this._nextGoalY = wrapper.readInt();
                this._walkGoalX = wrapper.readInt();
                this._walkGoalY = wrapper.readInt();
                this._score = wrapper.readInt();
                this._userId = wrapper.readInt();
                this._teamId = wrapper.readInt();
                wrapper.readInt(); // objectId repeated
                this._name = wrapper.readString();
                this._motto = wrapper.readString();
                this._figure = wrapper.readString();
                this._gender = wrapper.readString();
                break;
            case SnowWarGameObjectData.OBJECT_TYPE_SNOWBALL:
                this._objectId = wrapper.readInt();
                this._locH = wrapper.readInt();
                this._locV = wrapper.readInt();
                this._height = wrapper.readInt();
                this._direction = wrapper.readInt();
                this._trajectory = wrapper.readInt();
                this._timeToLive = wrapper.readInt();
                this._throwerObjectId = wrapper.readInt();
                this._parabolaOffset = wrapper.readInt();
                break;
            case SnowWarGameObjectData.OBJECT_TYPE_MACHINE:
                this._objectId = wrapper.readInt();
                this._worldX = wrapper.readInt();
                this._worldY = wrapper.readInt();
                this._snowballCount = wrapper.readInt();
                break;
            case SnowWarGameObjectData.OBJECT_TYPE_TREE:
                this._objectId = wrapper.readInt();
                this._worldX = wrapper.readInt();
                this._worldY = wrapper.readInt();
                this._rotation = wrapper.readInt();
                this._height = wrapper.readInt();
                wrapper.readInt(); // parent furni id (unused by the web renderer)
                this._maximumHits = wrapper.readInt();
                this._hits = wrapper.readInt();
                break;
            case SnowWarGameObjectData.OBJECT_TYPE_PILE:
                this._objectId = wrapper.readInt();
                this._worldX = wrapper.readInt();
                this._worldY = wrapper.readInt();
                this._maxSnowballs = wrapper.readInt();
                this._snowballCount = wrapper.readInt();
                break;
        }
    }

    public get objectType(): number
    {
        return this._objectType;
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get worldX(): number
    {
        return this._worldX;
    }

    public get worldY(): number
    {
        return this._worldY;
    }

    public get rotation(): number
    {
        return this._rotation;
    }

    public get health(): number
    {
        return this._health;
    }

    public get snowballCount(): number
    {
        return this._snowballCount;
    }

    public get isBot(): number
    {
        return this._isBot;
    }

    public get activityTimer(): number
    {
        return this._activityTimer;
    }

    public get activityState(): number
    {
        return this._activityState;
    }

    public get nextGoalX(): number
    {
        return this._nextGoalX;
    }

    public get nextGoalY(): number
    {
        return this._nextGoalY;
    }

    public get walkGoalX(): number
    {
        return this._walkGoalX;
    }

    public get walkGoalY(): number
    {
        return this._walkGoalY;
    }

    public get score(): number
    {
        return this._score;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get teamId(): number
    {
        return this._teamId;
    }

    public get name(): string
    {
        return this._name;
    }

    public get motto(): string
    {
        return this._motto;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get locH(): number
    {
        return this._locH;
    }

    public get locV(): number
    {
        return this._locV;
    }

    public get height(): number
    {
        return this._height;
    }

    public get direction(): number
    {
        return this._direction;
    }

    public get trajectory(): number
    {
        return this._trajectory;
    }

    public get timeToLive(): number
    {
        return this._timeToLive;
    }

    public get throwerObjectId(): number
    {
        return this._throwerObjectId;
    }

    public get parabolaOffset(): number
    {
        return this._parabolaOffset;
    }

    public get maximumHits(): number
    {
        return this._maximumHits;
    }

    public get hits(): number
    {
        return this._hits;
    }

    public get maxSnowballs(): number
    {
        return this._maxSnowballs;
    }
}

import { IMessageDataWrapper } from '@nitrots/api';

export class HousekeepingRoomData
{
    private _id: number = 0;
    private _name: string = '';
    private _description: string = '';
    private _ownerId: number = 0;
    private _ownerName: string = '';
    private _userCount: number = 0;
    private _maxUsers: number = 0;
    private _isLocked: boolean = false;
    private _isMuted: boolean = false;
    private _isPublic: boolean = false;
    private _createdAt: number = 0;

    constructor(wrapper: IMessageDataWrapper)
    {
        if(!wrapper) throw new Error('invalid_wrapper');

        this._id = wrapper.readInt();
        this._name = wrapper.readString();
        this._description = wrapper.readString();
        this._ownerId = wrapper.readInt();
        this._ownerName = wrapper.readString();
        this._userCount = wrapper.readInt();
        this._maxUsers = wrapper.readInt();
        this._isLocked = wrapper.readBoolean();
        this._isMuted = wrapper.readBoolean();
        this._isPublic = wrapper.readBoolean();
        this._createdAt = wrapper.readInt();
    }

    public get id(): number
    {
        return this._id;
    }
    public get name(): string
    {
        return this._name;
    }
    public get description(): string
    {
        return this._description;
    }
    public get ownerId(): number
    {
        return this._ownerId;
    }
    public get ownerName(): string
    {
        return this._ownerName;
    }
    public get userCount(): number
    {
        return this._userCount;
    }
    public get maxUsers(): number
    {
        return this._maxUsers;
    }
    public get isLocked(): boolean
    {
        return this._isLocked;
    }
    public get isMuted(): boolean
    {
        return this._isMuted;
    }
    public get isPublic(): boolean
    {
        return this._isPublic;
    }
    public get createdAt(): number
    {
        return this._createdAt;
    }
}

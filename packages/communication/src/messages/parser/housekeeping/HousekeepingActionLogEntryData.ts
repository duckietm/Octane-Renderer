import { IMessageDataWrapper } from '@octane/api';

export class HousekeepingActionLogEntryData
{
    private _id: number = 0;
    private _timestamp: number = 0;
    private _actorId: number = 0;
    private _actorName: string = '';
    private _targetType: string = 'user';
    private _targetId: number = 0;
    private _targetLabel: string = '';
    private _action: string = '';
    private _detail: string = '';
    private _success: boolean = true;

    constructor(wrapper: IMessageDataWrapper)
    {
        if(!wrapper) throw new Error('invalid_wrapper');

        this._id = wrapper.readInt();
        this._timestamp = wrapper.readInt();
        this._actorId = wrapper.readInt();
        this._actorName = wrapper.readString();
        this._targetType = wrapper.readString();
        this._targetId = wrapper.readInt();
        this._targetLabel = wrapper.readString();
        this._action = wrapper.readString();
        this._detail = wrapper.readString();
        this._success = wrapper.readBoolean();
    }

    public get id(): number
    {
        return this._id;
    }
    public get timestamp(): number
    {
        return this._timestamp;
    }
    public get actorId(): number
    {
        return this._actorId;
    }
    public get actorName(): string
    {
        return this._actorName;
    }
    public get targetType(): string
    {
        return this._targetType;
    }
    public get targetId(): number
    {
        return this._targetId;
    }
    public get targetLabel(): string
    {
        return this._targetLabel;
    }
    public get action(): string
    {
        return this._action;
    }
    public get detail(): string
    {
        return this._detail;
    }
    public get success(): boolean
    {
        return this._success;
    }
}

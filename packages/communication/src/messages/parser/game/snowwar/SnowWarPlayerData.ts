import { IMessageDataWrapper } from '@octane/api';

export class SnowWarPlayerData
{
    private _objectId: number;
    private _userId: number;
    private _teamId: number;
    private _name: string;
    private _figure: string;
    private _gender: string;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._objectId = wrapper.readInt();
        this._userId = wrapper.readInt();
        this._teamId = wrapper.readInt();
        this._name = wrapper.readString();
        this._figure = wrapper.readString();
        this._gender = wrapper.readString();
    }

    public get objectId(): number
    {
        return this._objectId;
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

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }
}

import { IMessageDataWrapper } from '@octane/api';

export class SnowWarGameResultPlayerData
{
    private _userId: number;
    private _name: string;
    private _score: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._userId = wrapper.readInt();
        this._name = wrapper.readString();
        this._score = wrapper.readInt();
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get name(): string
    {
        return this._name;
    }

    public get score(): number
    {
        return this._score;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SnowWarGameObjectData } from './SnowWarGameObjectData';

export class SnowWarFullGameStatusParser implements IMessageParser
{
    private _turn: number;
    private _checksum: number;
    private _totalSecondsLeft: number;
    private _objects: SnowWarGameObjectData[];

    public flush(): boolean
    {
        this._turn = -1;
        this._checksum = 0;
        this._totalSecondsLeft = 0;
        this._objects = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._turn = wrapper.readInt();
        this._checksum = wrapper.readInt();
        this._totalSecondsLeft = wrapper.readInt();

        let totalObjects = wrapper.readInt();

        while(totalObjects > 0)
        {
            this._objects.push(new SnowWarGameObjectData(wrapper));

            totalObjects--;
        }

        return true;
    }

    public get turn(): number
    {
        return this._turn;
    }

    public get checksum(): number
    {
        return this._checksum;
    }

    public get totalSecondsLeft(): number
    {
        return this._totalSecondsLeft;
    }

    public get objects(): SnowWarGameObjectData[]
    {
        return this._objects;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarQueuePositionParser implements IMessageParser
{
    private _position: number;
    private _queueSize: number;

    public flush(): boolean
    {
        this._position = -1;
        this._queueSize = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._position = wrapper.readInt();
        this._queueSize = wrapper.readInt();

        return true;
    }

    public get position(): number
    {
        return this._position;
    }

    public get queueSize(): number
    {
        return this._queueSize;
    }
}

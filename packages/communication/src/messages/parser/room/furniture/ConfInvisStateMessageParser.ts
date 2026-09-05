import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { ConfInvisStateMessageData } from '../engine';

export class ConfInvisStateMessageParser implements IMessageParser
{
    private _stateData: ConfInvisStateMessageData;

    public flush(): boolean
    {
        this._stateData = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._stateData = new ConfInvisStateMessageData(wrapper);

        return true;
    }

    public get stateData(): ConfInvisStateMessageData
    {
        return this._stateData;
    }
}

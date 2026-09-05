import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HanditemBlockStateMessageData } from '../engine';

export class HanditemBlockStateMessageParser implements IMessageParser
{
    private _stateData: HanditemBlockStateMessageData;

    public flush(): boolean
    {
        this._stateData = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._stateData = new HanditemBlockStateMessageData(wrapper);

        return true;
    }

    public get stateData(): HanditemBlockStateMessageData
    {
        return this._stateData;
    }
}

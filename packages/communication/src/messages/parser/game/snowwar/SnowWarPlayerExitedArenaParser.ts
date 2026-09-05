import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarPlayerExitedArenaParser implements IMessageParser
{
    private _objectId: number;
    private _userId: number;

    public flush(): boolean
    {
        this._objectId = -1;
        this._userId = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._objectId = wrapper.readInt();
        this._userId = wrapper.readInt();

        return true;
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get userId(): number
    {
        return this._userId;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarGamesLeftParser implements IMessageParser
{
    private _gamesLeft: number;

    public flush(): boolean
    {
        this._gamesLeft = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._gamesLeft = wrapper.readInt();

        return true;
    }

    public get gamesLeft(): number
    {
        return this._gamesLeft;
    }
}

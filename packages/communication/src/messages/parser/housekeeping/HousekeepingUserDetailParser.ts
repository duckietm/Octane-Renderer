import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { HousekeepingUserDetailData } from './HousekeepingUserDetailData';

export class HousekeepingUserDetailParser implements IMessageParser
{
    private _found: boolean = false;
    private _user: HousekeepingUserDetailData | null = null;

    public flush(): boolean
    {
        this._found = false;
        this._user = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._found = wrapper.readBoolean();

        if(this._found) this._user = new HousekeepingUserDetailData(wrapper);

        return true;
    }

    public get found(): boolean
    {
        return this._found;
    }
    public get user(): HousekeepingUserDetailData | null
    {
        return this._user;
    }
}

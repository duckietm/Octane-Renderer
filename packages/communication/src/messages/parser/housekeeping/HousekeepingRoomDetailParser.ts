import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HousekeepingRoomData } from './HousekeepingRoomData';

export class HousekeepingRoomDetailParser implements IMessageParser
{
    private _found: boolean = false;
    private _room: HousekeepingRoomData | null = null;

    public flush(): boolean
    {
        this._found = false;
        this._room = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._found = wrapper.readBoolean();

        if(this._found) this._room = new HousekeepingRoomData(wrapper);

        return true;
    }

    public get found(): boolean
    {
        return this._found;
    }
    public get room(): HousekeepingRoomData | null
    {
        return this._room;
    }
}

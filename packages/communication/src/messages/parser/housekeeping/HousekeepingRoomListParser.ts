import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { HousekeepingRoomData } from './HousekeepingRoomData';

export class HousekeepingRoomListParser implements IMessageParser
{
    private _rooms: HousekeepingRoomData[] = [];

    public flush(): boolean
    {
        this._rooms = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++) this._rooms.push(new HousekeepingRoomData(wrapper));

        return true;
    }

    public get rooms(): HousekeepingRoomData[]
    {
        return this._rooms;
    }
}

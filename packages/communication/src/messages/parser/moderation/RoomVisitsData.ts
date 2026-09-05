import { IMessageDataWrapper } from '@octane/api';
import { RoomVisitData } from './RoomVisitData';

export class RoomVisitsData
{
    private _userId: number;
    private _userName: string;
    private _rooms: RoomVisitData[];

    constructor(wrapper: IMessageDataWrapper)
    {
        this._rooms = [];
        this._userId = wrapper.readInt();
        this._userName = wrapper.readString();
        const roomCount = wrapper.readInt();
        let i = 0;
        while(i < roomCount)
        {
            this._rooms.push(new RoomVisitData(wrapper));
            i++;
        }
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get userName(): string
    {
        return this._userName;
    }

    public get rooms(): RoomVisitData[]
    {
        return this._rooms;
    }
}

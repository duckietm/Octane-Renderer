import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HousekeepingRoomData } from './HousekeepingRoomData';

export class HousekeepingRoomDetailParser implements IMessageParser
{
    private _found: boolean = false;
    private _room: HousekeepingRoomData | null = null;
    private _categoryId: number = 0;
    private _tradeMode: number = 0;
    private _state: number = 0;
    private _tags: string[] = [];

    public flush(): boolean
    {
        this._found = false;
        this._room = null;
        this._categoryId = 0;
        this._tradeMode = 0;
        this._state = 0;
        this._tags = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._found = wrapper.readBoolean();

        if(!this._found) return true;

        this._room = new HousekeepingRoomData(wrapper);

        // Detail-only tail: the room list shares HousekeepingRoomData, so it lives here.
        if(!wrapper.bytesAvailable) return true;

        this._categoryId = wrapper.readInt();
        this._tradeMode = wrapper.readInt();
        this._state = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._tags.push(wrapper.readString());

            count--;
        }

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
    public get categoryId(): number
    {
        return this._categoryId;
    }
    public get tradeMode(): number
    {
        return this._tradeMode;
    }
    /** 0 open, 1 locked, 2 password, 3 invisible. */
    public get state(): number
    {
        return this._state;
    }
    public get tags(): string[]
    {
        return this._tags;
    }
}

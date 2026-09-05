import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SnowWarLevelItemData } from './SnowWarLevelItemData';
import { SnowWarMachineData } from './SnowWarMachineData';
import { SnowWarPlayerData } from './SnowWarPlayerData';

export class SnowWarLevelDataParser implements IMessageParser
{
    private _gameLengthSeconds: number;
    private _mapId: number;
    private _teamCount: number;
    private _players: SnowWarPlayerData[];
    private _heightmap: string;
    private _items: SnowWarLevelItemData[];
    private _machines: SnowWarMachineData[];
    private _canEditRoom: boolean;
    private _arenaName: string;

    public flush(): boolean
    {
        this._gameLengthSeconds = 0;
        this._mapId = -1;
        this._teamCount = 0;
        this._players = [];
        this._heightmap = '';
        this._items = [];
        this._machines = [];
        this._canEditRoom = false;
        this._arenaName = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._gameLengthSeconds = wrapper.readInt();
        this._mapId = wrapper.readInt();
        this._teamCount = wrapper.readInt();

        let totalPlayers = wrapper.readInt();

        while(totalPlayers > 0)
        {
            this._players.push(new SnowWarPlayerData(wrapper));

            totalPlayers--;
        }

        this._heightmap = wrapper.readString();

        let totalItems = wrapper.readInt();

        while(totalItems > 0)
        {
            this._items.push(new SnowWarLevelItemData(wrapper));

            totalItems--;
        }

        let totalMachines = wrapper.readInt();

        while(totalMachines > 0)
        {
            this._machines.push(new SnowWarMachineData(wrapper));

            totalMachines--;
        }

        // Optional trailing per-recipient flag (server >= snowwar editor).
        if(!wrapper.bytesAvailable) return true;

        this._canEditRoom = wrapper.readBoolean();
        if(wrapper.bytesAvailable) this._arenaName = wrapper.readString();

        return true;
    }

    public get gameLengthSeconds(): number
    {
        return this._gameLengthSeconds;
    }

    public get mapId(): number
    {
        return this._mapId;
    }

    public get teamCount(): number
    {
        return this._teamCount;
    }

    public get players(): SnowWarPlayerData[]
    {
        return this._players;
    }

    public get heightmap(): string
    {
        return this._heightmap;
    }

    public get heightmapRows(): string[]
    {
        return this._heightmap.split(String.fromCharCode(13));
    }

    public get items(): SnowWarLevelItemData[]
    {
        return this._items;
    }

    public get machines(): SnowWarMachineData[]
    {
        return this._machines;
    }

    public get canEditRoom(): boolean
    {
        return this._canEditRoom;
    }

    public get arenaName(): string
    {
        return this._arenaName;
    }
}

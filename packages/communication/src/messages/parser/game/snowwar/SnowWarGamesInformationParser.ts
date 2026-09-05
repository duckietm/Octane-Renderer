import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class SnowWarGamesInformationParser implements IMessageParser
{
    private _playersInQueue: number;
    private _gamesPlayed: number;
    private _minPlayers: number;
    private _canEdit: boolean;

    public flush(): boolean
    {
        this._playersInQueue = -1;
        this._gamesPlayed = -1;
        this._minPlayers = 0;
        this._canEdit = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._playersInQueue = wrapper.readInt();
        this._gamesPlayed = wrapper.readInt();

        // Optional trailing minimum-players value (server >= awaiting-players).
        if(!wrapper.bytesAvailable) return true;

        this._minPlayers = wrapper.readInt();

        // Optional trailing editor-permission flag (server >= queue editor).
        if(!wrapper.bytesAvailable) return true;

        this._canEdit = wrapper.readBoolean();

        return true;
    }

    public get playersInQueue(): number
    {
        return this._playersInQueue;
    }

    public get gamesPlayed(): number
    {
        return this._gamesPlayed;
    }

    public get minPlayers(): number
    {
        return this._minPlayers;
    }

    public get canEdit(): boolean
    {
        return this._canEdit;
    }
}

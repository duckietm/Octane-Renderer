import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Maintenance as the panel shows it: on or off, the rank that may still log in, its message and a running countdown. */
export class HousekeepingMaintenanceStatusParser implements IMessageParser
{
    private _enabled: boolean = false;
    private _minRank: number = 0;
    private _message: string = '';
    private _countdownEndsAt: number = 0;

    public flush(): boolean
    {
        this._enabled = false;
        this._minRank = 0;
        this._message = '';
        this._countdownEndsAt = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._enabled = wrapper.readBoolean();
        this._minRank = wrapper.readInt();
        this._message = wrapper.readString();
        this._countdownEndsAt = wrapper.readInt();

        return true;
    }

    public get enabled(): boolean
    {
        return this._enabled;
    }

    public get minRank(): number
    {
        return this._minRank;
    }

    public get message(): string
    {
        return this._message;
    }

    /** Unix seconds the countdown ends at, 0 when none is running. */
    public get countdownEndsAt(): number
    {
        return this._countdownEndsAt;
    }
}

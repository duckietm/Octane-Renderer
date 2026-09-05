import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Generic ack for any housekeeping action (ban, mute, kick, give-credits,
 * room-close, …). Carries an `actionKey` string so a single event handler
 * can multiplex over many in-flight actions and resolve the right Promise
 * via an `accept` predicate.
 */
export class HousekeepingActionResultParser implements IMessageParser
{
    private _actionKey: string = '';
    private _ok: boolean = false;
    private _actionId: number = 0;
    private _message: string = '';

    public flush(): boolean
    {
        this._actionKey = '';
        this._ok = false;
        this._actionId = 0;
        this._message = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._actionKey = wrapper.readString();
        this._ok = wrapper.readBoolean();
        this._actionId = wrapper.readInt();
        this._message = wrapper.readString();

        return true;
    }

    public get actionKey(): string
    {
        return this._actionKey;
    }
    public get ok(): boolean
    {
        return this._ok;
    }
    public get actionId(): number
    {
        return this._actionId;
    }
    public get message(): string
    {
        return this._message;
    }
}

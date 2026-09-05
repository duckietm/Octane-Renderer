import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Result of a lock / unlock request. Wire layout: bool locked, bool all, int affected.
 *
 * affected counts the chests whose state actually changed, so zero is a legitimate answer -- every
 * chest was already in that state.
 */
export class WiredChestLockStateMessageParser implements IMessageParser
{
    private _locked: boolean = false;
    private _all: boolean = false;
    private _affected: number = 0;

    public flush(): boolean
    {
        this._locked = false;
        this._all = false;
        this._affected = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._locked = wrapper.readBoolean();
        this._all = wrapper.readBoolean();
        this._affected = wrapper.readInt();

        return true;
    }

    public get locked(): boolean
    {
        return this._locked;
    }
    public get all(): boolean
    {
        return this._all;
    }
    public get affected(): number
    {
        return this._affected;
    }
}

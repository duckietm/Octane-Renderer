import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class BuildHeightAvailableParser implements IMessageParser
{
    private _available: boolean;
    private _minHeight: number;
    private _maxHeight: number;

    public flush(): boolean
    {
        this._available = false;
        this._minHeight = 0;
        this._maxHeight = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._available = wrapper.readBoolean();
        this._minHeight = wrapper.readInt();
        this._maxHeight = wrapper.readInt();

        return true;
    }

    public get available(): boolean
    {
        return this._available;
    }

    public get minHeight(): number
    {
        return this._minHeight;
    }

    public get maxHeight(): number
    {
        return this._maxHeight;
    }
}

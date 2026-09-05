import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class WiredFurniRuntimeStateParser implements IMessageParser
{
    private _itemId: number;
    private _key: string;
    private _value: number;
    private _supported: boolean;
    private _success: boolean;

    public flush(): boolean
    {
        this._itemId = 0;
        this._key = '';
        this._value = 0;
        this._supported = false;
        this._success = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemId = wrapper.readInt();
        this._key = wrapper.readString();
        this._value = wrapper.readInt();
        this._supported = wrapper.readBoolean();
        this._success = wrapper.readBoolean();
        return true;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get key(): string
    {
        return this._key;
    }

    public get value(): number
    {
        return this._value;
    }

    public get supported(): boolean
    {
        return this._supported;
    }

    public get success(): boolean
    {
        return this._success;
    }
}

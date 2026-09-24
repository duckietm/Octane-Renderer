import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class WiredWebApiKeyResultParser implements IMessageParser
{
    private _itemId = 0;
    private _isReadKey = false;
    private _key = '';

    public flush(): boolean
    {
        this._itemId = 0;
        this._isReadKey = false;
        this._key = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemId = wrapper.readInt();
        this._isReadKey = wrapper.readBoolean();
        this._key = wrapper.readString();

        return true;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get isReadKey(): boolean
    {
        return this._isReadKey;
    }

    public get key(): string
    {
        return this._key;
    }
}

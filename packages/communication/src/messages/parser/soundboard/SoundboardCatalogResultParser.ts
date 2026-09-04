import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class SoundboardCatalogResultParser implements IMessageParser
{
    private _operation = 0;
    private _resultCode = 0;
    private _soundId = 0;

    public flush(): boolean
    {
        this._operation = 0;
        this._resultCode = 0;
        this._soundId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._operation = wrapper.readInt();
        this._resultCode = wrapper.readInt();
        this._soundId = wrapper.readInt();

        return true;
    }

    public get operation(): number
    {
        return this._operation;
    }

    public get resultCode(): number
    {
        return this._resultCode;
    }

    public get soundId(): number
    {
        return this._soundId;
    }
}

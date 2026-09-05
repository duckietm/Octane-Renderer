import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FurniEditorResultMessageParser implements IMessageParser
{
    private _success: boolean;
    private _message: string;
    private _id: number;

    public flush(): boolean
    {
        this._success = false;
        this._message = '';
        this._id = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._success = wrapper.readBoolean();
        this._message = wrapper.readString();
        this._id = wrapper.readInt();

        return true;
    }

    public get success(): boolean
    {
        return this._success;
    }

    public get message(): string
    {
        return this._message;
    }

    public get id(): number
    {
        return this._id;
    }
}

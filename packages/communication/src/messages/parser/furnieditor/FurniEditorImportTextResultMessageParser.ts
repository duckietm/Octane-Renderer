import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FurniEditorImportTextResultMessageParser implements IMessageParser
{
    private _found: boolean;
    private _name: string;
    private _description: string;
    private _classname: string;

    public flush(): boolean
    {
        this._found = false;
        this._name = '';
        this._description = '';
        this._classname = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._found = wrapper.readBoolean();
        this._name = wrapper.readString();
        this._description = wrapper.readString();
        this._classname = wrapper.readString();

        return true;
    }

    public get found(): boolean
    {
        return this._found;
    }

    public get name(): string
    {
        return this._name;
    }

    public get description(): string
    {
        return this._description;
    }

    public get classname(): string
    {
        return this._classname;
    }
}

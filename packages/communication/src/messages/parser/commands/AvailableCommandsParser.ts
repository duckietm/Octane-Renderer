import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class AvailableCommandsParser implements IMessageParser
{
    private _commands: { key: string; description: string }[];

    public flush(): boolean
    {
        this._commands = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._commands = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._commands.push({
                key: wrapper.readString(),
                description: wrapper.readString()
            });
        }

        return true;
    }

    public get commands(): { key: string; description: string }[]
    {
        return this._commands;
    }
}
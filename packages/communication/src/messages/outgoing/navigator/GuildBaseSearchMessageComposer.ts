import { IMessageComposer } from '@octane/api';

export class GuildBaseSearchMessageComposer implements IMessageComposer<ConstructorParameters<typeof GuildBaseSearchMessageComposer>>
{
    private _data: ConstructorParameters<typeof GuildBaseSearchMessageComposer>;

    constructor(guildId: number)
    {
        this._data = [guildId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

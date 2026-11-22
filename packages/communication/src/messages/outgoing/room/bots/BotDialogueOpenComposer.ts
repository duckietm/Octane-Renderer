import { IMessageComposer } from '@octane/api';

/** A player opened a bot's menu: asks the server for that bot's dialogue. {@code botId} is the bot's web id. */
export class BotDialogueOpenComposer implements IMessageComposer<ConstructorParameters<typeof BotDialogueOpenComposer>>
{
    private _data: ConstructorParameters<typeof BotDialogueOpenComposer>;

    constructor(botId: number)
    {
        this._data = [ botId ];
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

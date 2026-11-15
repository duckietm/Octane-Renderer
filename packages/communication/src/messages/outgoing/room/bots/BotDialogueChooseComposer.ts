import { IMessageComposer } from '@octane/api';

/**
 * A player picked an option of a bot dialogue: the bot's web id, the code of the page the option came from and the
 * option's position on it. The server accepts it only for the page it showed that player.
 */
export class BotDialogueChooseComposer implements IMessageComposer<ConstructorParameters<typeof BotDialogueChooseComposer>>
{
    private _data: ConstructorParameters<typeof BotDialogueChooseComposer>;

    constructor(botId: number, nonce: number, index: number)
    {
        this._data = [ botId, nonce, index ];
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

import { IMessageComposer } from '@octane/api';

/**
 * A player took an item from a bot dialogue window: the bot's web id, the code of the window, the item's position and
 * how many. The server accepts it only for the window it showed that player and within the item's limit.
 */
export class BotDialogueWindowChooseComposer implements IMessageComposer<ConstructorParameters<typeof BotDialogueWindowChooseComposer>>
{
    private _data: ConstructorParameters<typeof BotDialogueWindowChooseComposer>;

    constructor(botId: number, nonce: number, index: number, amount: number)
    {
        this._data = [ botId, nonce, index, amount ];
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

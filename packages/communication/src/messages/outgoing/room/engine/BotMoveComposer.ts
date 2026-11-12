import { IMessageComposer } from '@octane/api';

/**
 * Moves or turns a rentable bot like furni (the official client's infostand Move and Rotate, and shift-click):
 * bot id, tile x, tile y, direction (0 to 7). A custom packet of this hotel.
 */
export class BotMoveComposer implements IMessageComposer<ConstructorParameters<typeof BotMoveComposer>>
{
    private _data: ConstructorParameters<typeof BotMoveComposer>;

    constructor(botId: number, x: number, y: number, direction: number)
    {
        this._data = [botId, x, y, direction];
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

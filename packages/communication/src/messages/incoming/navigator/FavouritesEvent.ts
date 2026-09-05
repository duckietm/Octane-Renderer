import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FavouritesMessageParser } from '../../parser';

export class FavouritesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FavouritesMessageParser);
    }

    public getParser(): FavouritesMessageParser
    {
        return this.parser as FavouritesMessageParser;
    }
}

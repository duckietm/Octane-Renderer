import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ClubGiftSelectedParser } from '../../parser';

export class ClubGiftSelectedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ClubGiftSelectedParser);
    }

    public getParser(): ClubGiftSelectedParser
    {
        return this.parser as ClubGiftSelectedParser;
    }
}

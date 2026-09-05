import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RecyclerPrizesMessageParser } from '../../parser';

export class RecyclerPrizesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RecyclerPrizesMessageParser);
    }

    public getParser(): RecyclerPrizesMessageParser
    {
        return this.parser as RecyclerPrizesMessageParser;
    }
}

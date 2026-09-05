import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GetForumsListMessageParser } from '../../parser';

export class ForumsListMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GetForumsListMessageParser);
    }

    public getParser(): GetForumsListMessageParser
    {
        return this.parser as GetForumsListMessageParser;
    }
}

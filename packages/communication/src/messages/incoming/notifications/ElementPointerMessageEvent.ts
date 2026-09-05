import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ElementPointerMessageParser } from '../../parser';

export class ElementPointerMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ElementPointerMessageParser);
    }

    public getParser(): ElementPointerMessageParser
    {
        return this.parser as ElementPointerMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ExtendedProfileChangedMessageParser } from '../../parser';

export class ExtendedProfileChangedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ExtendedProfileChangedMessageParser);
    }

    public getParser(): ExtendedProfileChangedMessageParser
    {
        return this.parser as ExtendedProfileChangedMessageParser;
    }
}

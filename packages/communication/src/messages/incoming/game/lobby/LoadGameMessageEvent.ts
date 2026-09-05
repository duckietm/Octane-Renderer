import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { LoadGameMessageParser } from '../../../parser';

export class LoadGameMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, LoadGameMessageParser);
    }

    public getParser(): LoadGameMessageParser
    {
        return this.parser as LoadGameMessageParser;
    }
}

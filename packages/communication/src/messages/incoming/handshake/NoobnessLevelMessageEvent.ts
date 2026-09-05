import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NoobnessLevelMessageParser } from '../../parser';

export class NoobnessLevelMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NoobnessLevelMessageParser);
    }

    public getParser(): NoobnessLevelMessageParser
    {
        return this.parser as NoobnessLevelMessageParser;
    }
}

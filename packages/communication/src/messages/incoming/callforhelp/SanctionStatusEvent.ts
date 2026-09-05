import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SanctionStatusMessageParser } from '../../parser';

export class SanctionStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SanctionStatusMessageParser);
    }

    public getParser(): SanctionStatusMessageParser
    {
        return this.parser as SanctionStatusMessageParser;
    }
}

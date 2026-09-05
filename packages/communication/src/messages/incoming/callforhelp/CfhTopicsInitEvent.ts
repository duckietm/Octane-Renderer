import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CfhTopicsInitMessageParser } from '../../parser';

export class CfhTopicsInitEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CfhTopicsInitMessageParser);
    }

    public getParser(): CfhTopicsInitMessageParser
    {
        return this.parser as CfhTopicsInitMessageParser;
    }
}

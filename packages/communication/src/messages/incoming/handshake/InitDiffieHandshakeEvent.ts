import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { InitDiffieHandshakeParser } from '../../parser';

export class InitDiffieHandshakeEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, InitDiffieHandshakeParser);
    }

    public getParser(): InitDiffieHandshakeParser
    {
        return this.parser as InitDiffieHandshakeParser;
    }
}

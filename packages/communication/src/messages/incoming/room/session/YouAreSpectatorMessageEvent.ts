import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YouAreSpectatorMessageParser } from '../../../parser';

export class YouAreSpectatorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YouAreSpectatorMessageParser);
    }

    public getParser(): YouAreSpectatorMessageParser
    {
        return this.parser;
    }
}

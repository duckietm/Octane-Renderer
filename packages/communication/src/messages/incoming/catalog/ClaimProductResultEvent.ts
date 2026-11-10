import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ClaimProductResultParser } from '../../parser';

export class ClaimProductResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ClaimProductResultParser);
    }

    public getParser(): ClaimProductResultParser
    {
        return this.parser as ClaimProductResultParser;
    }
}

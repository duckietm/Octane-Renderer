import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredPermanentVariableResultParser } from '../../parser';

export class WiredPermanentVariableResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredPermanentVariableResultParser);
    }

    public getParser(): WiredPermanentVariableResultParser
    {
        return this.parser as WiredPermanentVariableResultParser;
    }
}

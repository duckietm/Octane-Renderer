import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredUserPermanentVariablesListParser } from '../../parser';

export class WiredUserPermanentVariablesListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredUserPermanentVariablesListParser);
    }

    public getParser(): WiredUserPermanentVariablesListParser
    {
        return this.parser as WiredUserPermanentVariablesListParser;
    }
}

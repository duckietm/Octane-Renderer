import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredUserVariablesDataParser } from '../../parser';

export class WiredUserVariablesDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredUserVariablesDataParser);
    }

    public getParser(): WiredUserVariablesDataParser
    {
        return this.parser as WiredUserVariablesDataParser;
    }
}

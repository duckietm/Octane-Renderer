import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VariableFxStatusRemoveParser } from '../../parser';

export class VariableFxStatusRemoveEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VariableFxStatusRemoveParser);
    }

    public getParser(): VariableFxStatusRemoveParser
    {
        return this.parser as VariableFxStatusRemoveParser;
    }
}

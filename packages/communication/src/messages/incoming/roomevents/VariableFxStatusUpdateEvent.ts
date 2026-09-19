import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VariableFxStatusUpdateParser } from '../../parser';

export class VariableFxStatusUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VariableFxStatusUpdateParser);
    }

    public getParser(): VariableFxStatusUpdateParser
    {
        return this.parser as VariableFxStatusUpdateParser;
    }
}

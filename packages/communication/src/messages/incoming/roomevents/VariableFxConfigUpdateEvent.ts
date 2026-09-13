import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VariableFxConfigUpdateParser } from '../../parser';

export class VariableFxConfigUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VariableFxConfigUpdateParser);
    }

    public getParser(): VariableFxConfigUpdateParser
    {
        return this.parser as VariableFxConfigUpdateParser;
    }
}

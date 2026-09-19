import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VariableFxConfigRemoveParser } from '../../parser';

export class VariableFxConfigRemoveEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VariableFxConfigRemoveParser);
    }

    public getParser(): VariableFxConfigRemoveParser
    {
        return this.parser as VariableFxConfigRemoveParser;
    }
}

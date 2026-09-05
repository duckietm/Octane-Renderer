import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GenericErrorParser } from '../../parser';

export class GenericErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GenericErrorParser);
    }

    public getParser(): GenericErrorParser
    {
        return this.parser as GenericErrorParser;
    }
}

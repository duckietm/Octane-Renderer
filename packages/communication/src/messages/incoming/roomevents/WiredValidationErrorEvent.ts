import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredValidationErrorParser } from '../../parser';

export class WiredValidationErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredValidationErrorParser);
    }

    public getParser(): WiredValidationErrorParser
    {
        return this.parser as WiredValidationErrorParser;
    }
}

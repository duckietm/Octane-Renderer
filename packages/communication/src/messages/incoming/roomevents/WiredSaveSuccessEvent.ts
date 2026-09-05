import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredSaveSuccessParser } from '../../parser';

export class WiredSaveSuccessEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredSaveSuccessParser);
    }

    public getParser(): WiredSaveSuccessParser
    {
        return this.parser;
    }
}

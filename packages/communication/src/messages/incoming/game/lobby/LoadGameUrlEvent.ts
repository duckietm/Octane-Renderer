import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { LoadGameUrlParser } from '../../../parser';

export class LoadGameUrlEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, LoadGameUrlParser);
    }

    public getParser(): LoadGameUrlParser
    {
        return this.parser as LoadGameUrlParser;
    }
}

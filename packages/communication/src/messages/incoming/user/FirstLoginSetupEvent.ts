import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FirstLoginSetupParser } from '../../parser';

export class FirstLoginSetupEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FirstLoginSetupParser);
    }

    public getParser(): FirstLoginSetupParser
    {
        return this.parser as FirstLoginSetupParser;
    }
}

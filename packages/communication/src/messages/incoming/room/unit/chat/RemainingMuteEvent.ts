import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RemainingMuteParser } from '../../../../parser';

export class RemainingMuteEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RemainingMuteParser);
    }

    public getParser(): RemainingMuteParser
    {
        return this.parser as RemainingMuteParser;
    }
}

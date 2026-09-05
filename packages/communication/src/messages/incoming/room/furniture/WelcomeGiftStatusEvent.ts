import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WelcomeGiftStatusParser } from '../../../parser';

export class WelcomeGiftStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WelcomeGiftStatusParser);
    }

    public getParser(): WelcomeGiftStatusParser
    {
        return this.parser as WelcomeGiftStatusParser;
    }
}

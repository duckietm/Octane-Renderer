import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WelcomeGiftChangeEmailResultParser } from '../../parser';

export class WelcomeGiftChangeEmailResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WelcomeGiftChangeEmailResultParser);
    }

    public getParser(): WelcomeGiftChangeEmailResultParser
    {
        return this.parser as WelcomeGiftChangeEmailResultParser;
    }
}

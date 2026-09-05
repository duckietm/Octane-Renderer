import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NewUserExperienceGiftOfferMessageParser } from '../../parser/nux';

export class NewUserExperienceGiftOfferMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NewUserExperienceGiftOfferMessageParser);
    }

    public getParser(): NewUserExperienceGiftOfferMessageParser
    {
        return this.parser as NewUserExperienceGiftOfferMessageParser;
    }
}

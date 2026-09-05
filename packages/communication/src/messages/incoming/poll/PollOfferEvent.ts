import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PollOfferParser } from '../../parser';

export class PollOfferEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PollOfferParser);
    }

    public getParser(): PollOfferParser
    {
        return this.parser as PollOfferParser;
    }
}

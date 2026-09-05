import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RequestSpamWallPostItMessageParser } from '../../../parser';

export class RequestSpamWallPostItMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RequestSpamWallPostItMessageParser);
    }

    public getParser(): RequestSpamWallPostItMessageParser
    {
        return this.parser as RequestSpamWallPostItMessageParser;
    }
}

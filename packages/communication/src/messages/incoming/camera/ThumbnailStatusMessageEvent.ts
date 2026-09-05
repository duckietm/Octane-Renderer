import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ThumbnailStatusMessageParser } from '../../parser';

export class ThumbnailStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ThumbnailStatusMessageParser);
    }

    public getParser(): ThumbnailStatusMessageParser
    {
        return this.parser as ThumbnailStatusMessageParser;
    }
}

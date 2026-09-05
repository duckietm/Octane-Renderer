import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RentableSpaceStatusMessageParser } from '../../../parser';

export class RentableSpaceStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RentableSpaceStatusMessageParser);
    }

    public getParser(): RentableSpaceStatusMessageParser
    {
        return this.parser as RentableSpaceStatusMessageParser;
    }
}

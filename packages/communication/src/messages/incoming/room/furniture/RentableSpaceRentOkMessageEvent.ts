import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RentableSpaceRentOkMessageParser } from '../../../parser';

export class RentableSpaceRentOkMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RentableSpaceRentOkMessageParser);
    }

    public getParser(): RentableSpaceRentOkMessageParser
    {
        return this.parser as RentableSpaceRentOkMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomAdPurchaseInfoEventParser } from '../../parser';

export class RoomAdPurchaseInfoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomAdPurchaseInfoEventParser);
    }

    public getParser(): RoomAdPurchaseInfoEventParser
    {
        return this.parser as RoomAdPurchaseInfoEventParser;
    }
}

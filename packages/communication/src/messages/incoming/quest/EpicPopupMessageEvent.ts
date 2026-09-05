import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { EpicPopupMessageParser } from '../../parser';

export class EpicPopupMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EpicPopupMessageParser);
    }

    public getParser(): EpicPopupMessageParser
    {
        return this.parser as EpicPopupMessageParser;
    }
}

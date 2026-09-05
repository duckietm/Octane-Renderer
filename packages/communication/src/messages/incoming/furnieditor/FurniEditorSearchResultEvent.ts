import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurniEditorSearchResultMessageParser } from '../../parser';

export class FurniEditorSearchResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurniEditorSearchResultMessageParser);
    }

    public getParser(): FurniEditorSearchResultMessageParser
    {
        return this.parser as FurniEditorSearchResultMessageParser;
    }
}

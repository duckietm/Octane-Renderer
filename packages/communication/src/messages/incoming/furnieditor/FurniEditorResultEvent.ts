import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurniEditorResultMessageParser } from '../../parser';

export class FurniEditorResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurniEditorResultMessageParser);
    }

    public getParser(): FurniEditorResultMessageParser
    {
        return this.parser as FurniEditorResultMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FurniEditorImportTextResultMessageParser } from '../../parser';

export class FurniEditorImportTextResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FurniEditorImportTextResultMessageParser);
    }

    public getParser(): FurniEditorImportTextResultMessageParser
    {
        return this.parser as FurniEditorImportTextResultMessageParser;
    }
}

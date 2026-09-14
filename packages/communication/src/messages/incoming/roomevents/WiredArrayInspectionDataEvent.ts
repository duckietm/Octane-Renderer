import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredArrayInspectionDataParser } from '../../parser';

export class WiredArrayInspectionDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredArrayInspectionDataParser);
    }

    public getParser(): WiredArrayInspectionDataParser
    {
        return this.parser as WiredArrayInspectionDataParser;
    }
}

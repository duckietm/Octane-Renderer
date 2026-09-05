import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NavigatorMetadataParser } from '../../parser';

export class NavigatorMetadataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NavigatorMetadataParser);
    }

    public getParser(): NavigatorMetadataParser
    {
        return this.parser as NavigatorMetadataParser;
    }
}

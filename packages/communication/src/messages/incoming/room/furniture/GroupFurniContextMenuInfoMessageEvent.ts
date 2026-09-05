import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GroupFurniContextMenuInfoMessageParser } from '../../../parser';

export class GroupFurniContextMenuInfoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GroupFurniContextMenuInfoMessageParser);
    }

    public getParser(): GroupFurniContextMenuInfoMessageParser
    {
        return this.parser as GroupFurniContextMenuInfoMessageParser;
    }
}

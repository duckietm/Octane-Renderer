import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GroupBadgePartsParser } from '../../parser';

export class GroupBadgePartsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GroupBadgePartsParser);
    }

    public getParser(): GroupBadgePartsParser
    {
        return this.parser as GroupBadgePartsParser;
    }
}

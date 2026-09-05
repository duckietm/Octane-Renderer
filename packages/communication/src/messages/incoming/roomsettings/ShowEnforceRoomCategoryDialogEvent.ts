import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ShowEnforceRoomCategoryDialogParser } from '../../parser';

export class ShowEnforceRoomCategoryDialogEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ShowEnforceRoomCategoryDialogParser);
    }

    public getParser(): ShowEnforceRoomCategoryDialogParser
    {
        return this.parser as ShowEnforceRoomCategoryDialogParser;
    }
}

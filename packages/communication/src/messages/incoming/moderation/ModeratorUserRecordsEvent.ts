import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ModeratorUserRecordsParser } from '../../parser';

export class ModeratorUserRecordsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ModeratorUserRecordsParser);
    }

    public getParser(): ModeratorUserRecordsParser
    {
        return this.parser as ModeratorUserRecordsParser;
    }
}

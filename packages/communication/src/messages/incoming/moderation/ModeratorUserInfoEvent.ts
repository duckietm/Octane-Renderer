import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ModeratorUserInfoMessageParser } from '../../parser';

export class ModeratorUserInfoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ModeratorUserInfoMessageParser);
    }

    public getParser(): ModeratorUserInfoMessageParser
    {
        return this.parser as ModeratorUserInfoMessageParser;
    }
}

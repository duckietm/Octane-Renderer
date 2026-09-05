import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GroupSettingsParser } from '../../parser';

export class GroupSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GroupSettingsParser);
    }

    public getParser(): GroupSettingsParser
    {
        return this.parser as GroupSettingsParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ModeratorToolPreferencesMessageParser } from '../../parser';

export class ModeratorToolPreferencesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ModeratorToolPreferencesMessageParser);
    }

    public getParser(): ModeratorToolPreferencesMessageParser
    {
        return this.parser as ModeratorToolPreferencesMessageParser;
    }
}

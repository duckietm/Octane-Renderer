import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ModeratorMessageParser } from '../../parser';

export class ModeratorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ModeratorMessageParser);
    }

    public getParser(): ModeratorMessageParser
    {
        return this.parser as ModeratorMessageParser;
    }
}

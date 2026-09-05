import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ModeratorInitMessageParser } from '../../parser';

export class ModeratorInitMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ModeratorInitMessageParser);
    }

    public getParser(): ModeratorInitMessageParser
    {
        return this.parser as ModeratorInitMessageParser;
    }
}

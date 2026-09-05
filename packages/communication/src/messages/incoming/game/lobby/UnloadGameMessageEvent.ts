import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UnloadGameMessageParser } from '../../../parser';

export class UnloadGameMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UnloadGameMessageParser);
    }

    public getParser(): UnloadGameMessageParser
    {
        return this.parser as UnloadGameMessageParser;
    }
}

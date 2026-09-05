import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GameStatusMessageParser } from '../../../parser';

export class GameStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GameStatusMessageParser);
    }

    public getParser(): GameStatusMessageParser
    {
        return this.parser as GameStatusMessageParser;
    }
}

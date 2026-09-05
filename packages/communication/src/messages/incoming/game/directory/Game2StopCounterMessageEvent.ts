import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { Game2InArenaQueueMessageParser, Game2StopCounterMessageParser } from '../../../parser';

export class Game2StopCounterMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2StopCounterMessageParser);
    }

    public getParser(): Game2InArenaQueueMessageParser
    {
        return this.parser as Game2InArenaQueueMessageParser;
    }
}

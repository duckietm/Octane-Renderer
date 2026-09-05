import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { Game2StartingGameFailedMessageParser } from '../../../parser';

export class Game2StartingGameFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2StartingGameFailedMessageParser);
    }

    public getParser(): Game2StartingGameFailedMessageParser
    {
        return this.parser as Game2StartingGameFailedMessageParser;
    }
}

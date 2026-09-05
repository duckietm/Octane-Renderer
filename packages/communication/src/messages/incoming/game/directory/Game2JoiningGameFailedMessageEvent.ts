import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { Game2JoiningGameFailedMessageParser } from '../../../parser';

export class Game2JoiningGameFailedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2JoiningGameFailedMessageParser);
    }

    public getParser(): Game2JoiningGameFailedMessageParser
    {
        return this.parser as Game2JoiningGameFailedMessageParser;
    }
}

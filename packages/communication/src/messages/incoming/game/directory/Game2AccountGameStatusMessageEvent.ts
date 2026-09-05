import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { Game2AccountGameStatusMessageParser } from '../../../parser';

export class Game2AccountGameStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2AccountGameStatusMessageParser);
    }

    public getParser(): Game2AccountGameStatusMessageParser
    {
        return this.parser as Game2AccountGameStatusMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotDialogueWindowParser } from '../../../parser';

export class BotDialogueWindowEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotDialogueWindowParser);
    }

    public getParser(): BotDialogueWindowParser
    {
        return this.parser as BotDialogueWindowParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BotDialogueParser } from '../../../parser';

export class BotDialogueEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotDialogueParser);
    }

    public getParser(): BotDialogueParser
    {
        return this.parser as BotDialogueParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuizDataMessageParser } from '../../parser';

export class QuizDataMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuizDataMessageParser);
    }

    public getParser(): QuizDataMessageParser
    {
        return this.parser as QuizDataMessageParser;
    }
}

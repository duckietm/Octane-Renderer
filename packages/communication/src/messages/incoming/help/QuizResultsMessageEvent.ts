import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuizResultsMessageParser } from '../../parser';

export class QuizResultsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuizResultsMessageParser);
    }

    public getParser(): QuizResultsMessageParser
    {
        return this.parser as QuizResultsMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuestionFinishedParser } from '../../parser';

export class QuestionFinishedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuestionFinishedParser);
    }

    public getParser(): QuestionFinishedParser
    {
        return this.parser as QuestionFinishedParser;
    }
}

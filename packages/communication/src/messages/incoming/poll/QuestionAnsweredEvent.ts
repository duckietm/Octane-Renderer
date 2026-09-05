import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { QuestionAnsweredParser } from '../../parser';

export class QuestionAnsweredEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, QuestionAnsweredParser);
    }

    public getParser(): QuestionAnsweredParser
    {
        return this.parser as QuestionAnsweredParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TranslationResultParser } from '../../parser';

export class TranslationResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TranslationResultParser);
    }

    public getParser(): TranslationResultParser
    {
        return this.parser as TranslationResultParser;
    }
}

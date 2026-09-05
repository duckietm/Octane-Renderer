import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TranslationLanguagesParser } from '../../parser';

export class TranslationLanguagesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TranslationLanguagesParser);
    }

    public getParser(): TranslationLanguagesParser
    {
        return this.parser as TranslationLanguagesParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ShowMysteryBoxWaitMessageParser } from '../../parser/mysterybox';

export class ShowMysteryBoxWaitMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ShowMysteryBoxWaitMessageParser);
    }

    public getParser(): ShowMysteryBoxWaitMessageParser
    {
        return this.parser;
    }
}

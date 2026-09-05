import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CancelMysteryBoxWaitMessageParser } from '../../parser/mysterybox';

export class CancelMysteryBoxWaitMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CancelMysteryBoxWaitMessageParser);
    }

    public getParser(): CancelMysteryBoxWaitMessageParser
    {
        return this.parser;
    }
}

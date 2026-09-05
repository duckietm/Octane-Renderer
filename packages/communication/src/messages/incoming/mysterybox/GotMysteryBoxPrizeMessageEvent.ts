import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GotMysteryBoxPrizeMessageParser } from '../../parser/mysterybox';

export class GotMysteryBoxPrizeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GotMysteryBoxPrizeMessageParser);
    }

    public getParser(): GotMysteryBoxPrizeMessageParser
    {
        return this.parser as GotMysteryBoxPrizeMessageParser;
    }
}

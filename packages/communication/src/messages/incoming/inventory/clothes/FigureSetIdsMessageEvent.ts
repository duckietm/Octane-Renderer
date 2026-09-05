import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FigureSetIdsMessageParser } from '../../../parser';

export class FigureSetIdsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FigureSetIdsMessageParser);
    }

    public getParser(): FigureSetIdsMessageParser
    {
        return this.parser as FigureSetIdsMessageParser;
    }
}

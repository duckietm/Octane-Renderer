import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IsBadgeRequestFulfilledParser } from '../../../parser';

export class IsBadgeRequestFulfilledEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IsBadgeRequestFulfilledParser);
    }

    public getParser(): IsBadgeRequestFulfilledParser
    {
        return this.parser as IsBadgeRequestFulfilledParser;
    }
}

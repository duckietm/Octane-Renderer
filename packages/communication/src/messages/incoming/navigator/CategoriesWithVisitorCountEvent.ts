import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CategoriesWithVisitorCountParser } from '../../parser';

export class CategoriesWithVisitorCountEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CategoriesWithVisitorCountParser);
    }

    public getParser(): CategoriesWithVisitorCountParser
    {
        return this.parser as CategoriesWithVisitorCountParser;
    }
}

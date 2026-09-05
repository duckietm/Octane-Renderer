import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ConfirmBreedingRequestParser } from '../../../parser';

export class ConfirmBreedingRequestEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ConfirmBreedingRequestParser);
    }

    public getParser(): ConfirmBreedingRequestParser
    {
        return this.parser as ConfirmBreedingRequestParser;
    }
}

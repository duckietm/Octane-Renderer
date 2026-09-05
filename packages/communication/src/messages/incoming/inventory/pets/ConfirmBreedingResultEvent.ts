import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ConfirmBreedingResultParser } from '../../../parser';

export class ConfirmBreedingResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ConfirmBreedingResultParser);
    }

    public getParser(): ConfirmBreedingResultParser
    {
        return this.parser as ConfirmBreedingResultParser;
    }
}

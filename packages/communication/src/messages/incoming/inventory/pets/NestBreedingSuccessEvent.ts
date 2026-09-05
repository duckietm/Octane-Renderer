import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NestBreedingSuccessParser } from '../../../parser';

export class NestBreedingSuccessEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NestBreedingSuccessParser);
    }

    public getParser(): NestBreedingSuccessParser
    {
        return this.parser as NestBreedingSuccessParser;
    }
}

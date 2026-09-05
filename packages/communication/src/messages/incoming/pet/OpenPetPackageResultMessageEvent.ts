import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { OpenPetPackageResultMessageParser } from './../../parser';

export class OpenPetPackageResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, OpenPetPackageResultMessageParser);
    }

    public getParser(): OpenPetPackageResultMessageParser
    {
        return this.parser as OpenPetPackageResultMessageParser;
    }
}

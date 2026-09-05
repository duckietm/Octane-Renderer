import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { InitCameraMessageParser } from '../../parser';

export class InitCameraMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, InitCameraMessageParser);
    }

    public getParser(): InitCameraMessageParser
    {
        return this.parser as InitCameraMessageParser;
    }
}

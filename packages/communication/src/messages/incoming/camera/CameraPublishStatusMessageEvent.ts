import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CameraPublishStatusMessageParser } from '../../parser';

export class CameraPublishStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CameraPublishStatusMessageParser);
    }

    public getParser(): CameraPublishStatusMessageParser
    {
        return this.parser as CameraPublishStatusMessageParser;
    }
}

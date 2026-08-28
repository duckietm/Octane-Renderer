import { IMessageEvent } from '@nitrots/api';
import { MessageEvent } from '@nitrots/events';
import { WiredChestLockStateMessageParser } from '../../../parser';

export class WiredChestLockStateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredChestLockStateMessageParser);
    }

    public getParser(): WiredChestLockStateMessageParser
    {
        return this.parser as WiredChestLockStateMessageParser;
    }
}

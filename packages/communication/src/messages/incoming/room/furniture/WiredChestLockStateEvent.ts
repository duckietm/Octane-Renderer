import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
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

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WheelAdminPrizesParser } from '../../parser';

export class WheelAdminPrizesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WheelAdminPrizesParser);
    }

    public getParser(): WheelAdminPrizesParser
    {
        return this.parser as WheelAdminPrizesParser;
    }
}

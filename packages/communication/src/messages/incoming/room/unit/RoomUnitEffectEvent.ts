import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomUnitEffectParser } from '../../../parser';

export class RoomUnitEffectEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomUnitEffectParser);
    }

    public getParser(): RoomUnitEffectParser
    {
        return this.parser as RoomUnitEffectParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestUpgradeResultMessageParser } from '../../../parser';

export class ChestUpgradeResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestUpgradeResultMessageParser);
    }

    public getParser(): ChestUpgradeResultMessageParser
    {
        return this.parser as ChestUpgradeResultMessageParser;
    }
}

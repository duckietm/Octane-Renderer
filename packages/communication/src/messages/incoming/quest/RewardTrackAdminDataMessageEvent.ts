import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RewardTrackAdminDataMessageParser } from '../../parser';

/** RewardTrackAdminData (10100): every stored reward track for the staff editor. */
export class RewardTrackAdminDataMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RewardTrackAdminDataMessageParser);
    }

    public getParser(): RewardTrackAdminDataMessageParser
    {
        return this.parser as RewardTrackAdminDataMessageParser;
    }
}

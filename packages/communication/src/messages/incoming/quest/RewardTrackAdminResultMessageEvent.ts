import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RewardTrackAdminResultMessageParser } from '../../parser';

/** RewardTrackAdminResult (10105): the outcome of a staff editor write. */
export class RewardTrackAdminResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RewardTrackAdminResultMessageParser);
    }

    public getParser(): RewardTrackAdminResultMessageParser
    {
        return this.parser as RewardTrackAdminResultMessageParser;
    }
}

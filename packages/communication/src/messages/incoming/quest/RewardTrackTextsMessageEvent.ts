import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RewardTrackTextsMessageParser } from '../../parser';

/** RewardTrackTexts (10109): the localization texts of the active reward tracks, sent before the tracks. */
export class RewardTrackTextsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RewardTrackTextsMessageParser);
    }

    public getParser(): RewardTrackTextsMessageParser
    {
        return this.parser as RewardTrackTextsMessageParser;
    }
}

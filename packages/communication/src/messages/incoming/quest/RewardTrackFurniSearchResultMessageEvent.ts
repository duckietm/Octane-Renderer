import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RewardTrackFurniSearchResultMessageParser } from '../../parser';

/** RewardTrackFurniSearchResult (10107): the furni matching an editor search. */
export class RewardTrackFurniSearchResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RewardTrackFurniSearchResultMessageParser);
    }

    public getParser(): RewardTrackFurniSearchResultMessageParser
    {
        return this.parser as RewardTrackFurniSearchResultMessageParser;
    }
}

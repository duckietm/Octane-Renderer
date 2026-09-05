import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { YouArePlayingGameParser } from '../../../parser';

export class YouArePlayingGameEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YouArePlayingGameParser);
    }

    public getParser(): YouArePlayingGameParser
    {
        return this.parser as YouArePlayingGameParser;
    }
}

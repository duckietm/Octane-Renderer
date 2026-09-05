import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TalentTrackParser } from '../../parser';

export class TalentTrackMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TalentTrackParser);
    }

    public getParser(): TalentTrackParser
    {
        return this.parser as TalentTrackParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarStartLobbyCounterParser } from '../../../parser';

export class SnowWarStartLobbyCounterEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarStartLobbyCounterParser);
    }

    public getParser(): SnowWarStartLobbyCounterParser
    {
        return this.parser as SnowWarStartLobbyCounterParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SnowWarLobbyTeamsParser } from '../../../parser';

export class SnowWarLobbyTeamsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarLobbyTeamsParser);
    }

    public getParser(): SnowWarLobbyTeamsParser
    {
        return this.parser as SnowWarLobbyTeamsParser;
    }
}

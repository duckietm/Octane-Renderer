import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RelationshipStatusInfoMessageParser } from '../../../parser';

export class RelationshipStatusInfoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RelationshipStatusInfoMessageParser);
    }

    public getParser(): RelationshipStatusInfoMessageParser
    {
        return this.parser as RelationshipStatusInfoMessageParser;
    }
}

import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserSongDisksInventoryMessageParser } from '../../parser';

export class UserSongDisksInventoryMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserSongDisksInventoryMessageParser);
    }

    public getParser(): UserSongDisksInventoryMessageParser
    {
        return this.parser as UserSongDisksInventoryMessageParser;
    }
}

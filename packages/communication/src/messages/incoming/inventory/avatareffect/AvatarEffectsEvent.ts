import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AvatarEffectsParser } from '../../../parser';

export class AvatarEffectsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AvatarEffectsParser);
    }

    public getParser(): AvatarEffectsParser
    {
        return this.parser as AvatarEffectsParser;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MentionListItem } from './MentionListItem';

export class MentionReceivedParser implements IMessageParser
{
    private _mention: MentionListItem;

    public flush(): boolean
    {
        this._mention = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._mention = new MentionListItem(wrapper, false);
        return true;
    }

    public get mention(): MentionListItem
    {
        return this._mention;
    }
}

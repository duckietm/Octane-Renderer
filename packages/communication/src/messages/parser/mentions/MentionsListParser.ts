import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { MentionListItem } from './MentionListItem';

export class MentionsListParser implements IMessageParser
{
    private _mentions: MentionListItem[];

    public flush(): boolean
    {
        this._mentions = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._mentions = [];
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            this._mentions.push(new MentionListItem(wrapper, true));
        }
        return true;
    }

    public get mentions(): MentionListItem[]
    {
        return this._mentions;
    }
}

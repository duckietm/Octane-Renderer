import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class GroupDetailsChangedMessageParser implements IMessageParser
{
    private _groupId: number;

    public flush(): boolean
    {
        this._groupId = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._groupId = wrapper.readInt();

        return true;
    }

    public get groupId(): number
    {
        return this._groupId;
    }
}

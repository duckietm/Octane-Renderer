import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { BadgeAndPointLimit } from './BadgeAndPointLimit';

export class BadgePointLimitsParser implements IMessageParser
{
    private _data: BadgeAndPointLimit[];

    public flush(): boolean
    {
        this._data = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let totalGroups = wrapper.readInt();

        while(totalGroups > 0)
        {
            const badgeCode = wrapper.readString();
            const limitCount = wrapper.readInt();

            let i = 0;

            while(i < limitCount)
            {
                this._data.push(new BadgeAndPointLimit(badgeCode, wrapper));

                i++;
            }

            totalGroups--;
        }

        return true;
    }

    public get data(): BadgeAndPointLimit[]
    {
        return this._data;
    }
}

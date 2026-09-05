import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class UserClassificationMessageParser implements IMessageParser
{
    private _classifiedUsersNames: Map<number, string>;
    private _classifiedUsersClass: Map<number, string>;

    public flush(): boolean
    {
        if(this._classifiedUsersNames)
        {
            this._classifiedUsersNames = new Map();
        }
        if(this._classifiedUsersClass)
        {
            this._classifiedUsersClass = new Map();
        }

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let userId: number;
        let userName: string;
        let userClass: string;

        let count: number = wrapper.readInt();

        this._classifiedUsersNames = new Map();
        this._classifiedUsersClass = new Map();

        while(count > 0)
        {
            userId = wrapper.readInt();
            userName = wrapper.readString();
            userClass = wrapper.readString();
            this._classifiedUsersNames.set(userId, userName);
            this._classifiedUsersClass.set(userId, userClass);
            count--;
        }

        return true;
    }

    public get classifiedUsernameMap(): Map<number, string>
    {
        return this._classifiedUsersNames;
    }

    public get classifiedUserTypeMap(): Map<number, string>
    {
        return this._classifiedUsersClass;
    }
}

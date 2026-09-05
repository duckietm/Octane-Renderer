import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IssueMessageData } from './IssueMessageData';

export class IssuePickFailedMessageParser implements IMessageParser
{
    private _issues: IssueMessageData[];
    private _retryEnabled: boolean;
    private _retryCount: number;

    public flush(): boolean
    {
        this._issues = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._issues = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const issueId = wrapper.readInt();
            const pickerUserId = wrapper.readInt();
            const pickerUserName = wrapper.readString();
            const issue = new IssueMessageData(issueId, 0, 0, 0, 0, 0, 0, 0, null, 0, null, pickerUserId, pickerUserName, null, 0, []);
            this._issues.push(issue);
        }

        this._retryEnabled = wrapper.readBoolean();
        this._retryCount = wrapper.readInt();
        return true;
    }

    public get issues(): IssueMessageData[]
    {
        return this._issues;
    }

    public get retryEnabled(): boolean
    {
        return this._retryEnabled;
    }

    public get retryCount(): number
    {
        return this._retryCount;
    }
}

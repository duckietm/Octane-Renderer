import { IMessageComposer } from '@octane/api';

export class CloseIssueDefaultActionMessageComposer implements IMessageComposer<number[]>
{
    private _data: number[];

    constructor(issueId: number, issueIds: number[], categoryId: number)
    {
        this._data = [issueId, issueIds.length, ...issueIds, categoryId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

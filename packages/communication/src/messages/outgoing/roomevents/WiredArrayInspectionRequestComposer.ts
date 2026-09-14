import { IMessageComposer } from '@octane/api';

export class WiredArrayInspectionRequestComposer implements IMessageComposer<ConstructorParameters<typeof WiredArrayInspectionRequestComposer>>
{
    private _data: ConstructorParameters<typeof WiredArrayInspectionRequestComposer>;

    constructor(variableType: number, requestedOwnerId: number, definitionItemId: number, page: number, pageSize: number)
    {
        this._data = [ variableType, requestedOwnerId, definitionItemId, page, pageSize ];
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

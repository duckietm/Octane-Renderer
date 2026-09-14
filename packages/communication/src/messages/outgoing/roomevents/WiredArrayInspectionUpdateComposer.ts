import { IMessageComposer } from '@octane/api';

export class WiredArrayInspectionUpdateComposer implements IMessageComposer<ConstructorParameters<typeof WiredArrayInspectionUpdateComposer>>
{
    private _data: ConstructorParameters<typeof WiredArrayInspectionUpdateComposer>;

    constructor(
        variableType: number,
        requestedOwnerId: number,
        definitionItemId: number,
        index: number,
        fieldId: number,
        value: string,
        page: number,
        pageSize: number)
    {
        this._data = [ variableType, requestedOwnerId, definitionItemId, index, fieldId, value, page, pageSize ];
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

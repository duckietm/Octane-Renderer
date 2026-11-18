import { IImportedListItem } from './ImportedListItem';

export class ImportedItemListComposerFixture
{
    private _data: unknown[];

    constructor(items: IImportedListItem[])
    {
        this._data = [ items.length ];
        for(const item of items) this._data.push(item.id);
    }

    public getMessageArray()
    {
        return this._data;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CatalogRefData } from './CatalogRefData';
import { FurniDetailData } from './FurniDetailData';

export class FurniEditorDetailResultMessageParser implements IMessageParser
{
    private _item: FurniDetailData;
    private _catalogItems: CatalogRefData[];
    private _furniDataJson: string;
    private _furniDataDiagnosticJson: string;

    public flush(): boolean
    {
        this._item = null;
        this._catalogItems = [];
        this._furniDataJson = '';
        this._furniDataDiagnosticJson = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._item = new FurniDetailData();
        this._item.parse(wrapper);

        const catalogCount = wrapper.readInt();

        this._catalogItems = [];

        for(let i = 0; i < catalogCount; i++)
        {
            const ref = new CatalogRefData();
            ref.parse(wrapper);
            this._catalogItems.push(ref);
        }

        this._furniDataJson = wrapper.readString();
        this._furniDataDiagnosticJson = wrapper.bytesAvailable ? wrapper.readString() : '{}';

        return true;
    }

    public get item(): FurniDetailData
    {
        return this._item;
    }

    public get catalogItems(): CatalogRefData[]
    {
        return this._catalogItems;
    }

    public get furniDataJson(): string
    {
        return this._furniDataJson;
    }

    public get furniDataDiagnosticJson(): string
    {
        return this._furniDataDiagnosticJson;
    }
}

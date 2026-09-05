import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { NodeData } from './NodeData';

export class CatalogIndexMessageParser implements IMessageParser
{
    private _root: NodeData;
    private _newAdditionsAvailable: boolean;
    private _catalogType: string;

    private static requireBytes(wrapper: IMessageDataWrapper, amount: number, field: string): void
    {
        const remaining = wrapper.remainingBytes;

        if((typeof remaining === 'number') && (remaining < amount))
        {
            throw new Error(`Catalog index packet truncated while reading ${ field }`);
        }
    }

    public flush(): boolean
    {
        this._root = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._root = new NodeData(wrapper);

        CatalogIndexMessageParser.requireBytes(wrapper, 1, 'additions flag');
        this._newAdditionsAvailable = wrapper.readBoolean();

        CatalogIndexMessageParser.requireBytes(wrapper, 2, 'catalog type');
        this._catalogType = wrapper.readString();

        if((typeof wrapper.remainingBytes === 'number') && (wrapper.remainingBytes < 0))
        {
            throw new Error('Catalog index packet truncated while reading catalog type');
        }

        return true;
    }

    public get root(): NodeData
    {
        return this._root;
    }

    public get newAdditionsAvailable(): boolean
    {
        return this._newAdditionsAvailable;
    }

    public get catalogType(): string
    {
        return this._catalogType;
    }
}

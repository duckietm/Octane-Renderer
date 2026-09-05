import { IMessageComposer } from '@octane/api';
import { encodeCatalogStudioDocument } from '../../../catalog/studio/CatalogStudioDocumentWireCodec';

export class CatalogStudioDocumentDryRunComposer implements IMessageComposer<(string | number)[]>
{
    private _data: (string | number)[];
    constructor(operationId: string, draftVersionId: number, expectedRevision: number, format: 'SQL', document: string)
    {
        const encoded = encodeCatalogStudioDocument(document);
        this._data = [ operationId, draftVersionId, expectedRevision, format, encoded.encoding, encoded.chunks.length, ...encoded.chunks ];
    }
    public dispose(): void
    {
        this._data = null;
    }
    public getMessageArray()
    {
        return this._data;
    }
}

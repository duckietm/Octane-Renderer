import { IMessageComposer } from '@nitrots/api';
import { encodeCatalogStudioDocument } from '../../../catalog/studio/CatalogStudioDocumentWireCodec';

export class CatalogStudioDocumentApplyComposer implements IMessageComposer<(string | number)[]>
{
    private _data: (string | number)[];
    constructor(operationId: string, draftVersionId: number, expectedRevision: number, rootLockToken: string,
        format: 'SQL', document: string, fingerprint: string, summary: string)
    {
        const encoded = encodeCatalogStudioDocument(document);
        this._data = [ operationId, draftVersionId, expectedRevision, rootLockToken, format, encoded.encoding,
            encoded.chunks.length, ...encoded.chunks, fingerprint, summary ];
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

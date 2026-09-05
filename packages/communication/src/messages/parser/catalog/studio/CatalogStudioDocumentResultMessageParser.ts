import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CATALOG_STUDIO_DOCUMENT_ENCODING, CATALOG_STUDIO_DOCUMENT_MAX_CHUNKS, decodeCatalogStudioDocument } from '../../../catalog/studio/CatalogStudioDocumentWireCodec';

export interface CatalogStudioDocumentChange
{
    entityType: string;
    catalogType: string;
    entityId: number;
    operation: string;
    fields: string[];
}

export class CatalogStudioDocumentResultMessageParser implements IMessageParser
{
    public operationId = '';
    public success = false;
    public code = '';
    public message = '';
    public revision = 0;
    public format = '';
    public document = '';
    public fingerprint = '';
    public changedEntities = 0;
    public changes: CatalogStudioDocumentChange[] = [];
    public flush(): boolean
    {
        this.operationId = ''; this.success = false; this.code = ''; this.message = ''; this.revision = 0;
        this.format = ''; this.document = ''; this.fingerprint = ''; this.changedEntities = 0; this.changes = []; return true;
    }
    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        try
        {
            this.operationId = wrapper.readString();
            this.success = wrapper.readBoolean();
            this.code = wrapper.readString();
            this.message = wrapper.readString();
            this.revision = wrapper.readInt();
            this.format = wrapper.readString();
            const encodingOrLegacyDocument = wrapper.readString();
            if(encodingOrLegacyDocument === CATALOG_STUDIO_DOCUMENT_ENCODING)
            {
                const chunkCount = wrapper.readInt();
                if(chunkCount < 0 || chunkCount > CATALOG_STUDIO_DOCUMENT_MAX_CHUNKS) return false;
                this.document = decodeCatalogStudioDocument(
                    encodingOrLegacyDocument,
                    Array.from({ length: chunkCount }, () => wrapper.readString()));
            }
            else this.document = encodingOrLegacyDocument;
            this.fingerprint = wrapper.readString();
            this.changedEntities = wrapper.readInt();
            if(wrapper.bytesAvailable)
            {
                const changeCount = wrapper.readInt();
                if(changeCount < 0 || changeCount > 100_000) return false;
                this.changes = Array.from({ length: changeCount }, () =>
                {
                    const entityType = wrapper.readString();
                    const catalogType = wrapper.readString();
                    const entityId = wrapper.readInt();
                    const operation = wrapper.readString();
                    const fieldCount = wrapper.readInt();
                    if(fieldCount < 0 || fieldCount > 128) throw new Error('Invalid catalog diff field count');
                    const fields = Array.from({ length: fieldCount }, () => wrapper.readString());
                    return { entityType, catalogType, entityId, operation, fields };
                });
            }
            return true;
        }
        catch
        {
            this.flush();
            return false;
        }
    }
}

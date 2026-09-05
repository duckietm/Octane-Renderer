import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface CatalogStudioChangedEntity
{
    entityType: string;
    entityId: number;
}

export interface CatalogStudioPublishConflict
{
    catalogType: string;
    entityType: string;
    entityId: number;
    field: string;
}

export class CatalogStudioOperationMessageParser implements IMessageParser
{
    public operationId = '';
    public success = false;
    public code = '';
    public message = '';
    public revision = 0;
    public changedEntities: CatalogStudioChangedEntity[] = [];
    public importedChanges = 0;
    public conflicts: CatalogStudioPublishConflict[] = [];

    public flush(): boolean
    {
        this.operationId = '';
        this.success = false;
        this.code = '';
        this.message = '';
        this.revision = 0;
        this.changedEntities = [];
        this.importedChanges = 0;
        this.conflicts = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this.operationId = wrapper.readString();
        this.success = wrapper.readBoolean();
        this.code = wrapper.readString();
        this.message = wrapper.readString();
        this.revision = wrapper.readInt();
        this.changedEntities = Array.from({ length: wrapper.readInt() }, () => ({
            entityType: wrapper.readString(), entityId: wrapper.readInt()
        }));
        if(!wrapper.bytesAvailable) return true;
        this.importedChanges = wrapper.readInt();
        this.conflicts = Array.from({ length: wrapper.readInt() }, () => ({
            catalogType: wrapper.readString(),
            entityType: wrapper.readString(),
            entityId: wrapper.readInt(),
            field: wrapper.readString()
        }));
        return true;
    }
}

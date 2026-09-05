import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface CatalogStudioHistoryEntry
{
    entityType: string;
    entityId: number;
    operation: string;
}

export interface CatalogStudioHistoryGroup
{
    id: number;
    revision: number;
    actorId: number;
    actorName: string;
    summary: string;
    source: string;
    createdAt: string;
    entries: CatalogStudioHistoryEntry[];
}

export class CatalogStudioHistoryMessageParser implements IMessageParser
{
    public draftVersionId = 0;
    public revision = 0;
    public totalCount = 0;
    public groups: CatalogStudioHistoryGroup[] = [];

    public flush(): boolean
    {
        this.draftVersionId = 0;
        this.revision = 0;
        this.totalCount = 0;
        this.groups = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this.draftVersionId = wrapper.readInt();
        this.revision = wrapper.readInt();
        this.totalCount = wrapper.readInt();
        this.groups = Array.from({ length: wrapper.readInt() }, () =>
        {
            const group = {
                id: wrapper.readInt(),
                revision: wrapper.readInt(),
                actorId: wrapper.readInt(),
                actorName: wrapper.readString(),
                summary: wrapper.readString(),
                source: wrapper.readString(),
                createdAt: wrapper.readString(),
                entries: [] as CatalogStudioHistoryEntry[]
            };
            group.entries = Array.from({ length: wrapper.readInt() }, () => ({
                entityType: wrapper.readString(), entityId: wrapper.readInt(), operation: wrapper.readString()
            }));
            return group;
        });
        return true;
    }
}

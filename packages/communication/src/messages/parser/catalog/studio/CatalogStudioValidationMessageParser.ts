import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface CatalogStudioValidationIssue
{
    code: string;
    entityType: string;
    entityId: number;
    field: string;
    message: string;
}

export class CatalogStudioValidationMessageParser implements IMessageParser
{
    public operationId = '';
    public success = false;
    public code = '';
    public message = '';
    public revision = 0;
    public current = false;
    public issues: CatalogStudioValidationIssue[] = [];

    public flush(): boolean
    {
        this.operationId = '';
        this.success = false;
        this.code = '';
        this.message = '';
        this.revision = 0;
        this.current = false;
        this.issues = [];
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
        this.current = wrapper.readBoolean();
        this.issues = Array.from({ length: wrapper.readInt() }, () => ({
            code: wrapper.readString(),
            entityType: wrapper.readString(),
            entityId: wrapper.readInt(),
            field: wrapper.readString(),
            message: wrapper.readString()
        }));
        return true;
    }
}

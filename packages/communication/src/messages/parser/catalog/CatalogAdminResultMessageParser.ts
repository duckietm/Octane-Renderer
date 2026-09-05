import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CatalogAdminSmartSaveResult, isCatalogAdminSmartSaveAction, parseCatalogAdminEntity, parseCatalogAdminFieldErrors, parseCatalogAdminHistoryGroup } from './CatalogAdminSmartSaveResult';

export class CatalogAdminResultMessageParser implements IMessageParser
{
    private _success: boolean;
    private _message: string;
    private _smartSaveResult: CatalogAdminSmartSaveResult | null = null;

    public flush(): boolean
    {
        this._success = false;
        this._message = '';
        this._smartSaveResult = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._success = wrapper.readBoolean();
        this._message = wrapper.readString();
        this._smartSaveResult = null;

        if(!wrapper.bytesAvailable) return true;

        try
        {
            const protocolVersion = wrapper.readInt();
            if(protocolVersion !== 1) return true;

            const operationId = wrapper.readString();
            const action = wrapper.readString();
            const code = wrapper.readString();
            const draftVersionId = wrapper.readInt();
            const revision = wrapper.readInt();
            const entityType = wrapper.readString();
            const catalogType = wrapper.readString();
            const entityId = wrapper.readInt();
            const entityJson = wrapper.readString();
            const historyGroupJson = wrapper.readString();
            const fieldErrorsJson = wrapper.readString();
            const serverDurationMs = wrapper.readInt();

            if(!operationId || !isCatalogAdminSmartSaveAction(action) || !code || draftVersionId <= 0 || revision < 0 ||
                ((entityType !== 'PAGE') && (entityType !== 'OFFER')) ||
                ((catalogType !== 'NORMAL') && (catalogType !== 'BUILDER')) || entityId < 0 || serverDurationMs < 0)
                return true;

            this._smartSaveResult = {
                protocolVersion: 1,
                operationId,
                action,
                code,
                draftVersionId,
                revision,
                entityType,
                catalogType,
                entityId,
                entity: parseCatalogAdminEntity(entityJson, entityType, catalogType, entityId),
                historyGroup: parseCatalogAdminHistoryGroup(historyGroupJson),
                fieldErrors: parseCatalogAdminFieldErrors(fieldErrorsJson),
                serverDurationMs
            };
        }
        catch
        {
            this._smartSaveResult = null;
        }

        return true;
    }

    public get success(): boolean
    {
        return this._success;
    }

    public get message(): string
    {
        return this._message;
    }

    public get smartSaveResult(): CatalogAdminSmartSaveResult | null
    {
        return this._smartSaveResult;
    }
}

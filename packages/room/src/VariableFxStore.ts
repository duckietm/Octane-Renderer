import { IVariableFxConfigData, IVariableFxStatusData } from '@octane/communication';

/**
 * Per-room state for the Variable FX feature: the drawing configurations (keyed by
 * configId) and the live status values (keyed by the "configId|variableId" statusKey
 * the emulator sends). Read-only holder - nothing here draws anything.
 */
export class VariableFxStore
{
    private _configs = new Map<number, IVariableFxConfigData>();
    private _statuses = new Map<string, IVariableFxStatusData>();

    public applyConfigs(configs: IVariableFxConfigData[]): void
    {
        for(const config of configs) this._configs.set(config.configId, config);
    }

    public removeConfigs(configIds: number[]): void
    {
        const removedIds = new Set(configIds);

        for(const configId of configIds) this._configs.delete(configId);

        for(const statusKey of this._statuses.keys())
        {
            if(removedIds.has(VariableFxStore.configIdOf(statusKey))) this._statuses.delete(statusKey);
        }
    }

    public applyStatuses(initializeAll: boolean, statuses: IVariableFxStatusData[]): void
    {
        if(initializeAll) this._statuses.clear();

        for(const status of statuses) this._statuses.set(status.statusKey, status);
    }

    public removeStatuses(statusKeys: string[]): void
    {
        for(const statusKey of statusKeys) this._statuses.delete(statusKey);
    }

    public getConfig(configId: number): IVariableFxConfigData | undefined
    {
        return this._configs.get(configId);
    }

    public statusesForEntity(isUserEntity: boolean, entityId: number): IVariableFxStatusData[]
    {
        return Array.from(this._statuses.values())
            .filter(status => status.isUserEntity === isUserEntity && status.entityId === entityId);
    }

    /** The key is "<configId>|<variableId>"; only the configId half matters here. */
    private static configIdOf(statusKey: string): number
    {
        return Number(statusKey.split('|')[0]);
    }
}

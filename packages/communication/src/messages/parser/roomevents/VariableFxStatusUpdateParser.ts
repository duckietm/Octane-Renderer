import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { readWiredLong } from './WiredVariableData';

/** One variable's live value for one entity, as the status packet carries it. */
export interface IVariableFxStatusData
{
    statusKey: string;
    isInitialize: boolean;
    isUserEntity: boolean;
    entityId: number;
    value: number;
    hasOverrides: boolean;
    overrideMinValue: number;
    overrideMaxValue: number;
    extras: Map<string, string>;
}

export class VariableFxStatusUpdateParser implements IMessageParser
{
    private _initializeAll: boolean;
    private _statuses: IVariableFxStatusData[];

    public flush(): boolean
    {
        this._initializeAll = false;
        this._statuses = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._initializeAll = wrapper.readBoolean();
        this._statuses = [];

        let totalStatuses = wrapper.readInt();

        while(totalStatuses > 0)
        {
            const statusKey = wrapper.readString();
            const rawIsInitialize = wrapper.readBoolean();
            const isUserEntity = wrapper.readBoolean();
            const entityId = wrapper.readInt();
            const value = readWiredLong(wrapper);
            const hasOverrides = wrapper.readBoolean();
            let overrideMinValue = 0;
            let overrideMaxValue = 0;

            if(hasOverrides)
            {
                overrideMinValue = readWiredLong(wrapper);
                overrideMaxValue = readWiredLong(wrapper);
            }

            const extras = new Map<string, string>();

            let totalExtras = wrapper.readInt();

            while(totalExtras > 0)
            {
                extras.set(wrapper.readString(), wrapper.readString());

                totalExtras--;
            }

            this._statuses.push({
                statusKey,
                // The official client ORs the per-entry flag with the packet-level one at read
                // time (_loc8_ = readBoolean() || initializeAll) - the emulator sends it raw.
                isInitialize: rawIsInitialize || this._initializeAll,
                isUserEntity,
                entityId,
                value,
                hasOverrides,
                overrideMinValue,
                overrideMaxValue,
                extras
            });

            totalStatuses--;
        }

        return true;
    }

    public get initializeAll(): boolean
    {
        return this._initializeAll;
    }

    public get statuses(): IVariableFxStatusData[]
    {
        return this._statuses;
    }
}

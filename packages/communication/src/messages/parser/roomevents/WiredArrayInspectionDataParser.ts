import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWiredArrayInspectionField
{
    id: number;
    name: string;
    order: number;
    textConnected: boolean;
}

export interface IWiredArrayInspectionDefinition
{
    arrayFormat: 'simple' | 'record';
    arrayMode: 'list' | 'slots';
    fields: IWiredArrayInspectionField[];
    inspectable: boolean;
    itemId: number;
    maxEntries: number;
    name: string;
    referenced: boolean;
    schemaVersion: number;
    valueShape: 'array';
    variableType: number;
    writable: boolean;
}

export interface IWiredArrayInspectionEntry
{
    connectedText: Record<string, string>;
    index: number;
    occupied: boolean;
    values: Record<string, string>;
}

export interface IWiredArrayInspectionData
{
    definition: IWiredArrayInspectionDefinition | null;
    endIndex: number;
    entries: IWiredArrayInspectionEntry[];
    hasArray: boolean;
    logicalLength: number;
    occupiedCount: number;
    ownerId: number;
    page: number;
    pageCount: number;
    pageSize: number;
    protocolVersion: number;
    requestedOwnerId: number;
    requestedOwnerType: string;
    startIndex: number;
    totalIndexes: number;
}

export class WiredArrayInspectionDataParser implements IMessageParser
{
    private _data: IWiredArrayInspectionData | null = null;

    public flush(): boolean
    {
        this._data = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        try
        {
            const parsed = JSON.parse(wrapper.readString()) as IWiredArrayInspectionData;

            if(!parsed || parsed.protocolVersion !== 1 || !Array.isArray(parsed.entries)) return false;
            this._data = parsed;
            return true;
        }
        catch
        {
            this._data = null;
            return false;
        }
    }

    public get data(): IWiredArrayInspectionData | null
    {
        return this._data;
    }
}

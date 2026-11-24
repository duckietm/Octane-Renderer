import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { readWiredLong } from './WiredVariableData';
import { IWiredVariableStorage } from './WiredVariableHoldersPageParser';

/** `WiredVariableStorageParameter` with its leading variable id. */
export interface IWiredPermanentVariable extends IWiredVariableStorage
{
    variableId: string;
}

/** The entity type of a Habbo: the one whose list carries no owner. */
export const WIRED_PERMANENT_VARIABLES_ENTITY_HABBO = 1;

/**
 * Official AIR `WiredUserPermanentVariablesList` (2933): one holder and the permanent variables it holds.
 * AIR adds an owner (id, name, figure) after the figure for an entity that is not a Habbo; the server lists every
 * holder as a Habbo, so that block is never sent and is not read here.
 */
export class WiredUserPermanentVariablesListParser implements IMessageParser
{
    private _entityType: number;
    private _entityId: number;
    private _entityName: string;
    private _entityFigure: string;
    private _variables: IWiredPermanentVariable[];

    public flush(): boolean
    {
        this._entityType = 0;
        this._entityId = 0;
        this._entityName = '';
        this._entityFigure = '';
        this._variables = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._entityType = wrapper.readInt();
        this._entityId = wrapper.readInt();
        this._entityName = wrapper.readString();
        this._entityFigure = wrapper.readString();

        this._variables = [];

        const total = wrapper.readInt();

        for(let i = 0; i < total; i++)
        {
            this._variables.push({
                variableId: wrapper.readString(),
                value: wrapper.readInt(),
                creationTime: readWiredLong(wrapper),
                creationTimeStr: wrapper.readString(),
                lastUpdateTime: readWiredLong(wrapper),
                lastUpdateTimeStr: wrapper.readString()
            });
        }

        return true;
    }

    public get entityType(): number
    {
        return this._entityType;
    }

    public get entityId(): number
    {
        return this._entityId;
    }

    public get entityName(): string
    {
        return this._entityName;
    }

    public get entityFigure(): string
    {
        return this._entityFigure;
    }

    public get variables(): IWiredPermanentVariable[]
    {
        return this._variables;
    }
}

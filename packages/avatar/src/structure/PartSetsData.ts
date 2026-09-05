import { IActionDefinition, IFigureSetData } from '@octane/api';
import { ActionDefinition } from '../actions';
import { ActivePartSet, PartDefinition } from './parts';

export class PartSetsData implements IFigureSetData
{
    private _parts: Map<string, PartDefinition>;
    private _activePartSets: Map<string, ActivePartSet>;

    constructor()
    {
        this._parts = new Map();
        this._activePartSets = new Map();
    }

    public parse(data: any): boolean
    {
        if(data.partSet && (data.partSet.length > 0))
        {
            for(const part of data.partSet)
            {
                if(!part) continue;

                this._parts.set(part.setType, new PartDefinition(part));
            }
        }

        if(data.activePartSets && (data.activePartSets.length > 0))
        {
            for(const activePart of data.activePartSets)
            {
                if(!activePart) continue;

                this._activePartSets.set(activePart.id, new ActivePartSet(activePart));
            }
        }

        return true;
    }

    public appendJSON(data: any): boolean
    {
        if(data.partSet && (data.partSet.length > 0))
        {
            for(const part of data.partSet)
            {
                if(!part) continue;

                this._parts.set(part.setType, new PartDefinition(part));
            }
        }

        if(data.activePartSets && (data.activePartSets.length > 0))
        {
            for(const activePart of data.activePartSets)
            {
                if(!activePart) continue;

                this._activePartSets.set(activePart.id, new ActivePartSet(activePart));
            }
        }

        return false;
    }

    public getActiveParts(action: IActionDefinition): string[]
    {
        const activePartSet = this._activePartSets.get(action.activePartSet);

        if(!activePartSet) return [];

        return activePartSet.parts;
    }

    public getPartDefinition(part: string): PartDefinition
    {
        const existing = this._parts.get(part);

        if(!existing) return null;

        return existing;
    }

    public addPartDefinition(data: any): PartDefinition
    {
        const setType = data.setType as string;

        let existing = this._parts.get(setType);

        if(!existing)
        {
            existing = new PartDefinition(data);

            this._parts.set(setType, existing);
        }

        return existing;
    }

    public getActivePartSet(action: ActionDefinition): ActivePartSet
    {
        const existing = this._activePartSets.get(action.activePartSet);

        if(!existing) return null;

        return existing;
    }

    public get parts(): Map<string, PartDefinition>
    {
        return this._parts;
    }

    public get activePartSets(): Map<string, ActivePartSet>
    {
        return this._activePartSets;
    }
}

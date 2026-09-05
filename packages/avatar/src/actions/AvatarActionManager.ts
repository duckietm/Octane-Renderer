import { IActiveActionData, IAssetManager } from '@octane/api';
import { ActionDefinition } from './ActionDefinition';

export class AvatarActionManager
{
    private _assets: IAssetManager;
    private _actions: Map<string, ActionDefinition>;
    private _defaultAction: ActionDefinition;

    constructor(assets: IAssetManager, data: any)
    {
        this._assets = assets;
        this._actions = new Map();
        this._defaultAction = null;

        this.updateActions(data);
    }

    public updateActions(data: any): void
    {
        if(!data) return;

        for(const action of data.actions)
        {
            if(!action || !action.state) continue;

            const definition = new ActionDefinition(action);

            this._actions.set(definition.state, definition);
            this._actions.set(definition.state.toLowerCase(), definition);
        }

        if(data.actionOffsets) this.parseActionOffsets(data.actionOffsets);
    }

    private parseActionOffsets(offsets: any): void
    {
        if(!offsets || !offsets.length) return;

        for(const offset of offsets)
        {
            const action = this.getActionByState(offset.action);

            if(!action) continue;

            for(const canvasOffset of offset.offsets)
            {
                const size = (canvasOffset.size || '');
                const direction = canvasOffset.direction;

                if((size === '') || (direction === undefined)) continue;

                const x = (canvasOffset.x || 0);
                const y = (canvasOffset.y || 0);
                const z = (canvasOffset.z || 0);

                action.setOffsets(size, direction, [x, y, z]);
            }
        }
    }

    private getActionByState(state: string): ActionDefinition
    {
        if(!state) return null;

        return (this._actions.get(state) || this._actions.get(state.toLowerCase()) || this._actions.get(state.toUpperCase()) || null);
    }

    public getActionDefinition(id: string): ActionDefinition
    {
        if(!id) return null;

        for(const action of this._actions.values())
        {
            if(!action || (action.id !== id)) continue;

            return action;
        }

        return null;
    }

    public getActionDefinitionWithState(state: string): ActionDefinition
    {
        return this.getActionByState(state);
    }

    public getDefaultAction(): ActionDefinition
    {
        if(this._defaultAction) return this._defaultAction;

        for(const action of this._actions.values())
        {
            if(!action || !action.isDefault) continue;

            this._defaultAction = action;

            return action;
        }

        return null;
    }

    public getCanvasOffsets(activeActions: IActiveActionData[], size: string, direction: number): number[]
    {
        let canvasOffsets: number[] = [];

        for(const activeAction of activeActions)
        {
            if(!activeAction) continue;

            const action = this.getActionByState(activeAction.actionType);
            const offsets = action && action.getOffsets(size, direction);

            if(offsets) canvasOffsets = offsets;
        }

        return canvasOffsets;
    }

    public sortActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        if(!actions) return null;

        actions = this.filterActions(actions);

        const validatedActions: IActiveActionData[] = [];

        for(const action of actions)
        {
            if(!action) continue;

            const definition = this.getActionByState(action.actionType);

            if(!definition) continue;

            action.definition = definition;

            validatedActions.push(action);
        }

        validatedActions.sort((actionOne: IActiveActionData, actionTwo: IActiveActionData) =>
        {
            if(!actionOne || !actionTwo) return 0;

            const precedenceOne = actionOne.definition.precedence;
            const precedenceTwo = actionTwo.definition.precedence;

            if(precedenceOne < precedenceTwo) return 1;

            if(precedenceOne > precedenceTwo) return -1;

            return 0;
        });

        return validatedActions;
    }

    private filterActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        let preventions: string[] = [];
        const activeActions: IActiveActionData[] = [];

        for(const action of actions)
        {
            if(!action) continue;

            const localAction = this.getActionByState(action.actionType);

            if(localAction) preventions = preventions.concat(localAction.getPrevents(action.actionParameter));
        }

        for(const action of actions)
        {
            if(!action) continue;

            let actionType = action.actionType;

            if(action.actionType === 'fx') actionType = (actionType + ('.' + action.actionParameter));

            if(preventions.indexOf(actionType) >= 0) continue;

            activeActions.push(action);
        }

        return activeActions;
    }
}

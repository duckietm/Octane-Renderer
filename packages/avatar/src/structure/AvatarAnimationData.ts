import { IActionDefinition, IFigureSetData } from '@octane/api';
import { AnimationAction } from './animation';

export class AvatarAnimationData implements IFigureSetData
{
    private _actions: Map<string, AnimationAction>;

    constructor()
    {
        this._actions = new Map();
    }

    public parse(data: any): boolean
    {
        if(data && (data.length > 0))
        {
            for(const animation of data)
            {
                if(!animation) continue;

                const newAnimation = new AnimationAction(animation);

                this._actions.set(newAnimation.id, newAnimation);
            }
        }

        return true;
    }

    public appendJSON(data: any): boolean
    {
        for(const action of data.action)
        {
            this._actions.set(action.id, new AnimationAction(action));
        }

        return true;
    }

    public getAction(action: IActionDefinition): AnimationAction
    {
        const existing = this._actions.get(action.id);

        if(!existing) return null;

        return existing;
    }

    public getFrameCount(action: IActionDefinition): number
    {
        const animationAction = this.getAction(action);

        if(!animationAction) return 0;

        return animationAction.frameCount;
    }
}

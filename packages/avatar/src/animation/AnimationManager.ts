import { IAnimation, IAnimationLayerData, IAnimationManager, IAssetAnimation } from '@octane/api';
import { AvatarStructure } from '../AvatarStructure';
import { Animation } from './Animation';

export class AnimationManager implements IAnimationManager
{
    private _animations: Map<string, Animation>;

    constructor()
    {
        this._animations = new Map();
    }

    public registerAnimation(structure: AvatarStructure, animations: { [index: string]: IAssetAnimation }): boolean
    {
        if(!animations) return false;

        const animationData = animations[Object.keys(animations)[0]];

        const animation = new Animation(structure, animationData);

        this._animations.set(animationData.name, animation);

        return true;
    }

    public getAnimation(animation: string): Animation
    {
        const existing = this._animations.get(animation);

        if(!existing) return null;

        return existing;
    }

    public getLayerData(animation: string, frameCount: number, spriteId: string): IAnimationLayerData
    {
        const existing = this.getAnimation(animation);

        if(!existing) return null;

        return existing.getLayerData(frameCount, spriteId);
    }

    public get animations(): Map<string, IAnimation>
    {
        return this._animations;
    }
}

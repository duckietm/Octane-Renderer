import { IAnimation, IAssetAnimation, IAssetAnimationFrame } from '@octane/api';
import { AvatarStructure } from '../AvatarStructure';
import { AddDataContainer } from './AddDataContainer';
import { AvatarAnimationLayerData } from './AvatarAnimationLayerData';
import { AvatarDataContainer } from './AvatarDataContainer';
import { DirectionDataContainer } from './DirectionDataContainer';
import { SpriteDataContainer } from './SpriteDataContainer';

export class Animation implements IAnimation
{
    private static EMPTY_ARRAY: any[] = [];

    private _id: string;
    private _description: string;
    private _frames: AvatarAnimationLayerData[][];
    private _spriteData: SpriteDataContainer[];
    private _avatarData: AvatarDataContainer;
    private _directionData: DirectionDataContainer;
    private _removeData: string[];
    private _addData: AddDataContainer[];
    private _overriddenActions: Map<string, string>;
    private _overrideFrames: Map<string, AvatarAnimationLayerData[][]>;
    private _resetOnToggle: boolean;

    constructor(structure: AvatarStructure, animationData: IAssetAnimation)
    {
        this._id = animationData.name;
        this._description = this._id;
        this._frames = [];
        this._spriteData = null;
        this._avatarData = null;
        this._directionData = null;
        this._removeData = null;
        this._addData = null;
        this._overriddenActions = null;
        this._overrideFrames = null;
        this._resetOnToggle = (animationData.resetOnToggle || false);

        if(animationData.sprites && animationData.sprites.length)
        {
            this._spriteData = [];

            for(const sprite of animationData.sprites) this._spriteData.push(new SpriteDataContainer(this, sprite));
        }

        if(animationData.avatars && animationData.avatars.length) this._avatarData = new AvatarDataContainer(animationData.avatars[0]);

        if(animationData.directions && animationData.directions.length) this._directionData = new DirectionDataContainer(animationData.directions[0]);

        if(animationData.removes && animationData.removes.length)
        {
            this._removeData = [];

            for(const remove of animationData.removes) this._removeData.push(remove.id);
        }

        if(animationData.adds && animationData.adds.length)
        {
            this._addData = [];

            for(const add of animationData.adds) this._addData.push(new AddDataContainer(add));
        }

        if(animationData.overrides && animationData.overrides.length)
        {
            this._overrideFrames = new Map();
            this._overriddenActions = new Map();

            for(const override of animationData.overrides)
            {
                const name = override.name;
                const value = override.override;

                this._overriddenActions.set(value, name);

                const frames: AvatarAnimationLayerData[][] = [];

                this.parseFrames(frames, override.frames, structure);

                this._overrideFrames.set(name, frames);
            }
        }

        this.parseFrames(this._frames, animationData.frames, structure);
    }

    private parseFrames(frames: AvatarAnimationLayerData[][], frameData: IAssetAnimationFrame[], structure: AvatarStructure): void
    {
        if(!frameData || !frameData.length) return;

        for(const frame of frameData)
        {
            let repeats = 1;

            if(frame.repeats && (frame.repeats > 1)) repeats = frame.repeats;

            let index = 0;

            while(index < repeats)
            {
                const layers: AvatarAnimationLayerData[] = [];

                if(frame.bodyparts && frame.bodyparts.length)
                {
                    for(const bodyPart of frame.bodyparts)
                    {
                        const definition = structure.getActionDefinition(bodyPart.action);
                        const layer = new AvatarAnimationLayerData(bodyPart, AvatarAnimationLayerData.BODYPART, definition);

                        layers.push(layer);
                    }
                }

                if(frame.fxs && frame.fxs.length)
                {
                    for(const fx of frame.fxs)
                    {
                        const definition = structure.getActionDefinition(fx.action);
                        const layer = new AvatarAnimationLayerData(fx, AvatarAnimationLayerData.FX, definition);

                        layers.push(layer);
                    }
                }

                frames.push(layers);

                index++;
            }
        }
    }

    public frameCount(actionName: string = null): number
    {
        if(!actionName) return this._frames.length;

        if(this._overrideFrames)
        {
            const overrideFrames = this._overrideFrames.get(actionName);

            if(overrideFrames) return overrideFrames.length;
        }

        return 0;
    }

    public hasOverriddenActions(): boolean
    {
        if(!this._overriddenActions) return false;

        return (this._overriddenActions.size > 0);
    }

    public overriddenActionNames(): string[]
    {
        if(!this._overriddenActions) return null;

        const keys: string[] = [];

        for(const key of this._overriddenActions.keys()) keys.push(key);

        return keys;
    }

    public overridingAction(actionName: string): string
    {
        if(!this._overriddenActions) return null;

        return this._overriddenActions.get(actionName);
    }

    private getFrame(frameCount: number, actionName: string = null): AvatarAnimationLayerData[]
    {
        if(frameCount < 0) frameCount = 0;

        let layers: AvatarAnimationLayerData[] = [];

        if(!actionName)
        {
            if(this._frames.length > 0)
            {
                layers = this._frames[(frameCount % this._frames.length)];
            }
        }
        else
        {
            if(this._overrideFrames)
            {
                const overrideLayers = this._overrideFrames.get(actionName);

                if(overrideLayers && (overrideLayers.length > 0))
                {
                    layers = overrideLayers[(frameCount % overrideLayers.length)];
                }
            }
        }

        return layers;
    }

    public getAnimatedBodyPartIds(frameCount: number, actionName: string = null): string[]
    {
        const bodyPartIds: string[] = [];

        for(const layer of this.getFrame(frameCount, actionName))
        {
            if(layer.type === AvatarAnimationLayerData.BODYPART)
            {
                bodyPartIds.push(layer.id);
            }

            else if(layer.type === AvatarAnimationLayerData.FX)
            {
                if(this._addData && this._addData.length)
                {
                    for(const addData of this._addData)
                    {
                        if(addData.id === layer.id) bodyPartIds.push(addData.align);
                    }
                }
            }
        }

        return bodyPartIds;
    }

    public getLayerData(frameCount: number, spriteId: string, actionName: string = null): AvatarAnimationLayerData
    {
        for(const layer of this.getFrame(frameCount, actionName))
        {
            if(layer.id === spriteId) return layer;

            if(layer.type === AvatarAnimationLayerData.FX)
            {
                if(this._addData && this._addData.length)
                {
                    for(const addData of this._addData)
                    {
                        if(((addData.align === spriteId) && (addData.id === layer.id))) return layer;
                    }
                }
            }
        }

        return null;
    }

    public hasAvatarData(): boolean
    {
        return this._avatarData !== null;
    }

    public hasDirectionData(): boolean
    {
        return this._directionData !== null;
    }

    public hasAddData(): boolean
    {
        return this._addData !== null;
    }

    public getAddData(id: string): AddDataContainer
    {
        if(this._addData)
        {
            for(const addData of this._addData)
            {
                if(addData.id === id) return addData;
            }
        }

        return null;
    }

    public get id(): string
    {
        return this._id;
    }

    public get spriteData(): SpriteDataContainer[]
    {
        return this._spriteData || Animation.EMPTY_ARRAY;
    }

    public get avatarData(): AvatarDataContainer
    {
        return this._avatarData;
    }

    public get directionData(): DirectionDataContainer
    {
        return this._directionData;
    }

    public get removeData(): string[]
    {
        return this._removeData || Animation.EMPTY_ARRAY;
    }

    public get addData(): AddDataContainer[]
    {
        return this._addData || Animation.EMPTY_ARRAY;
    }

    public toString(): string
    {
        return this._description;
    }

    public get resetOnToggle(): boolean
    {
        return this._resetOnToggle;
    }
}

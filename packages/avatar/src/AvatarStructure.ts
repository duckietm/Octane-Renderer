import { AvatarDirectionAngle, IActionDefinition, IActiveActionData, IAssetAnimation, IAssetManager, IAvatarFigureContainer, IAvatarImage, IAvatarRenderManager, IFigureData, IFigurePartSet, IPartColor, IStructureData } from '@octane/api';
import { Point } from 'pixi.js';
import { AvatarImagePartContainer } from './AvatarImagePartContainer';
import { AvatarRenderManager } from './AvatarRenderManager';
import { ActionDefinition, AvatarActionManager } from './actions';
import { Animation, AnimationManager, AvatarAnimationLayerData } from './animation';
import { AvatarModelGeometry } from './geometry';
import { AnimationAction, AvatarAnimationData, AvatarAnimationFrame, AvatarCanvas, FigureSetData, PartSetsData } from './structure';

export class AvatarStructure
{
    private _renderManager: AvatarRenderManager;
    private _geometry: AvatarModelGeometry;
    private _figureData: FigureSetData;
    private _partSetsData: PartSetsData;
    private _animationData: AvatarAnimationData;
    private _animationManager: AnimationManager;
    private _mandatorySetTypeIds: { [index: string]: { [index: number]: string[] } };
    private _actionManager: AvatarActionManager;
    private _defaultAction: IActionDefinition;

    constructor(renderManager: AvatarRenderManager)
    {
        this._renderManager = renderManager;
        this._geometry = null;
        this._figureData = new FigureSetData();
        this._partSetsData = new PartSetsData();
        this._animationData = new AvatarAnimationData();
        this._animationManager = new AnimationManager();
        this._mandatorySetTypeIds = {};
        this._actionManager = null;
        this._defaultAction = null;
    }

    public init(): void
    {

    }

    public initGeometry(data: any): void
    {
        if(!data) return;

        this._geometry = new AvatarModelGeometry(data);
    }

    public initActions(assets: IAssetManager, data: any): void
    {
        if(!data) return;

        this._actionManager = new AvatarActionManager(assets, data);
        this._defaultAction = this._actionManager.getDefaultAction();
    }

    public updateActions(data: any): void
    {
        this._actionManager.updateActions(data);

        this._defaultAction = this._actionManager.getDefaultAction();
    }

    public initPartSets(data: any): boolean
    {
        if(!data) return false;

        if(this._partSetsData.parse(data))
        {
            this._partSetsData.getPartDefinition('ri').appendToFigure = true;
            this._partSetsData.getPartDefinition('li').appendToFigure = true;

            return true;
        }

        return false;
    }

    public initAnimation(data: any): boolean
    {
        if(!data) return false;

        return this._animationData.parse(data);
    }

    public initFigureData(data: IFigureData): boolean
    {
        if(!data) return false;

        return this._figureData.parse(data);
    }

    public injectFigureData(data: IFigureData): void
    {
        this._figureData.injectJSON(data);
    }

    public registerAnimations(assets: IAssetManager, prefix: string = 'fx', maxCount: number = 200): void
    {
        let index = 0;

        while(index < maxCount)
        {
            const collection = assets.getCollection((prefix + index));

            if(collection)
            {
                const animationData = collection.data;

                this._animationManager.registerAnimation(this, animationData.animations);
            }

            index++;
        }
    }

    public registerAnimation(data: { [index: string]: IAssetAnimation }): void
    {
        this._animationManager.registerAnimation(this, data);
    }

    public getPartColor(figureContainer: IAvatarFigureContainer, partType: string, colorIndex: number = 0): IPartColor
    {
        const colorIds = figureContainer.getPartColorIds(partType);

        if(!colorIds || (colorIds.length < colorIndex)) return null;

        const setType = this._figureData.getSetType(partType);

        if(setType == null) return null;

        const palette = this._figureData.getPalette(setType.paletteID);

        if(!palette) return null;

        return palette.getColor(colorIds[colorIndex]);
    }

    public getBodyPartData(animation: string, frameCount: number, spriteId: string): AvatarAnimationLayerData
    {
        return this._animationManager.getLayerData(animation, frameCount, spriteId) as AvatarAnimationLayerData;
    }

    public getAnimation(name: string): Animation
    {
        return this._animationManager.getAnimation(name);
    }

    public getActionDefinition(id: string): ActionDefinition
    {
        return this._actionManager.getActionDefinition(id);
    }

    public getActionDefinitionWithState(state: string): ActionDefinition
    {
        return this._actionManager.getActionDefinitionWithState(state);
    }

    public isMainAvatarSet(setType: string): boolean
    {
        return this._geometry.isMainAvatarSet(setType);
    }

    public sortActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        return this._actionManager.sortActions(actions);
    }

    public maxFrames(actions: IActiveActionData[]): number
    {
        let maxFrameCount = 0;

        for(const action of actions)
        {
            maxFrameCount = Math.max(maxFrameCount, this._animationData.getFrameCount(action.definition));
        }

        return maxFrameCount;
    }

    public getMandatorySetTypeIds(gender: string, clubLevel: number): string[]
    {
        if(!this._mandatorySetTypeIds[gender])
        {
            this._mandatorySetTypeIds[gender] = [];
        }

        if(this._mandatorySetTypeIds[gender][clubLevel])
        {
            return this._mandatorySetTypeIds[gender][clubLevel];
        }

        this._mandatorySetTypeIds[gender][clubLevel] = this._figureData.getMandatorySetTypeIds(gender, clubLevel);

        return this._mandatorySetTypeIds[gender][clubLevel];
    }

    public getDefaultPartSet(partType: string, gender: string): IFigurePartSet
    {
        return this._figureData.getDefaultPartSet(partType, gender);
    }

    public getCanvasOffsets(actions: IActiveActionData[], scale: string, direction: number): number[]
    {
        return this._actionManager.getCanvasOffsets(actions, scale, direction);
    }

    public getCanvas(scale: string, geometryType: string): AvatarCanvas
    {
        return this._geometry.getCanvas(scale, geometryType);
    }

    public removeDynamicItems(avatar: IAvatarImage): void
    {
        this._geometry.removeDynamicItems(avatar);
    }

    public getActiveBodyPartIds(action: IActiveActionData, avatar: IAvatarImage): string[]
    {
        let partTypeIds: string[] = [];
        const bodyPartIds: string[] = [];
        const geometryType = action.definition.geometryType;

        if(action.definition.isAnimation)
        {
            const animationKey = ((action.definition.state + '.') + action.actionParameter);
            const animation = this._animationManager.getAnimation(animationKey);

            if(animation)
            {
                partTypeIds = animation.getAnimatedBodyPartIds(0, action.overridingAction);

                if(animation.hasAddData())
                {
                    const dynamicPart = {
                        id: '',
                        x: 0,
                        y: 0,
                        z: 0,
                        radius: 0.01,
                        nx: 0,
                        ny: 0,
                        nz: -1,
                        double: 1
                    };

                    const partSetDefinition = {
                        setType: ''
                    };

                    for(const addData of animation.addData)
                    {
                        const bodyPart = this._geometry.getBodyPart(geometryType, addData.align);

                        if(bodyPart)
                        {
                            dynamicPart.id = addData.id;
                            bodyPart.addPart(dynamicPart, avatar);

                            partSetDefinition.setType = addData.id;

                            const partDefinition = this._partSetsData.addPartDefinition(partSetDefinition);
                            partDefinition.appendToFigure = true;

                            if(addData.base === '') partDefinition.staticId = 1;

                            if(bodyPartIds.indexOf(bodyPart.id) === -1) bodyPartIds.push(bodyPart.id);
                        }
                    }
                }
            }

            for(const partTypeId of partTypeIds)
            {
                const bodyPart = this._geometry.getBodyPart(geometryType, partTypeId);

                if(bodyPart && (bodyPartIds.indexOf(bodyPart.id) === -1)) bodyPartIds.push(bodyPart.id);
            }

            if(bodyPartIds.length === 0)
            {
                partTypeIds = this._partSetsData.getActiveParts(action.definition);

                for(const partType of partTypeIds)
                {
                    const bodyPart = this._geometry.getBodyPartOfItem(geometryType, partType, avatar);

                    if(bodyPart && (bodyPartIds.indexOf(bodyPart.id) === -1)) bodyPartIds.push(bodyPart.id);
                }
            }
        }
        else
        {
            partTypeIds = this._partSetsData.getActiveParts(action.definition);

            for(const partType of partTypeIds)
            {
                const bodyPart = this._geometry.getBodyPartOfItem(geometryType, partType, avatar);

                if(bodyPart && (bodyPartIds.indexOf(bodyPart.id) === -1)) bodyPartIds.push(bodyPart.id);
            }
        }

        return bodyPartIds;
    }

    public getBodyPartsUnordered(avatarSet: string): string[]
    {
        return this._geometry.getBodyPartIdsInAvatarSet(avatarSet);
    }

    public getBodyParts(avatarSet: string, geometryType: string, direction: number): string[]
    {
        const angle = AvatarDirectionAngle.DIRECTION_TO_ANGLE[direction];

        return this._geometry.getBodyPartsAtAngle(avatarSet, angle, geometryType);
    }

    public getFrameBodyPartOffset(action: IActiveActionData, direction: number, frameCount: number, bodyPartId: string): Point
    {
        const animationAction = this._animationData.getAction(action.definition);

        if(animationAction) return animationAction.getFrameBodyPartOffset(direction, frameCount, bodyPartId);

        return AnimationAction.DEFAULT_OFFSET;
    }

    public getParts(bodyPartId: string, figureContainer: IAvatarFigureContainer, action: IActiveActionData, geometryType: string, direction: number, removes: string[], avatar: IAvatarImage, itemOverrides: Map<string, string> = null): AvatarImagePartContainer[]
    {
        const effectAnimation: Animation = null;
        let actionDefinition: IActionDefinition = null;
        let animationFrames: AvatarAnimationFrame[] = [];
        let partColor: IPartColor = null;

        if(!action) return [];

        const activePartTypes = this._partSetsData.getActiveParts(action.definition);
        const partContainers: AvatarImagePartContainer[] = [];
        let defaultFrames: any[] = [0];
        const animationAction = this._animationData.getAction(action.definition);

        if(action.definition.isAnimation)
        {
            const animationKey = ((action.definition.state + '.') + action.actionParameter);
            const spriteAnimation = this._animationManager.getAnimation(animationKey);

            if(spriteAnimation)
            {
                defaultFrames = this.getPopulatedArray(spriteAnimation.frameCount(action.overridingAction));

                for(const animatedPartId of spriteAnimation.getAnimatedBodyPartIds(0, action.overridingAction))
                {
                    if(animatedPartId === bodyPartId)
                    {
                        const geometryBodyPart = this._geometry.getBodyPart(geometryType, animatedPartId);

                        if(geometryBodyPart)
                        {
                            for(const dynamicPart of geometryBodyPart.getDynamicParts(avatar))
                            {
                                activePartTypes.push(dynamicPart.id);
                            }
                        }
                    }
                }
            }
        }

        const visiblePartTypes = this._geometry.getParts(geometryType, bodyPartId, direction, activePartTypes, avatar);
        const figurePartTypeIds = figureContainer.getPartTypeIds();
        const mainAction = avatar?.getMainAction?.();
        const isSittingPosture = (mainAction?.definition?.assetPartDefinition === 'sit')
            || (action.definition.assetPartDefinition === 'sit');
        // Effect 77 = "Riding". While in the saddle the companion/buddy ('pt') part
        // is hidden the same way it is while sitting.
        const isRidingPosture = (avatar?.getEffectId?.() === 77);
        const hidePetPart = isSittingPosture || isRidingPosture;

        for(const figurePartType of figurePartTypeIds)
        {
            if(itemOverrides)
            {
                if(itemOverrides.get(figurePartType)) continue;
            }

            const partSetId = figureContainer.getPartSetId(figurePartType);
            const partColorIds = figureContainer.getPartColorIds(figurePartType);
            const setType = this._figureData.getSetType(figurePartType);

            if(setType)
            {
                const palette = this._figureData.getPalette(setType.paletteID);

                if(palette)
                {
                    const figurePartSet = setType.getPartSet(partSetId);

                    if(figurePartSet)
                    {
                        removes = removes.concat(figurePartSet.hiddenLayers);

                        let petHasVisibleSit = false;

                        if(isSittingPosture && figurePartType === 'pt')
                        {
                            for(const fp of figurePartSet.parts)
                            {
                                if(fp.type === 'pt')
                                {
                                    for(const dir of ['0', '2'])
                                    {
                                        const assetName = 'h_sit_pt_' + fp.id + '_' + dir + '_0';
                                        const testAsset = this._renderManager.getAssetByName(assetName);

                                        if(testAsset && testAsset.width > 1 && testAsset.height > 1 && testAsset.source === assetName)
                                        {
                                            const stdName = 'h_std_pt_' + fp.id + '_' + dir + '_0';
                                            const stdAsset = this._renderManager.getAssetByName(stdName);

                                            if(!stdAsset || stdAsset.source !== assetName)
                                            {
                                                petHasVisibleSit = true;
                                                break;
                                            }
                                        }
                                    }

                                    break;
                                }
                            }
                        }

                        for(const figurePart of figurePartSet.parts)
                        {
                            if(hidePetPart && figurePartType === 'pt')
                            {
                                if(petHasVisibleSit && figurePart.type !== 'pt') continue;
                                if(!petHasVisibleSit) continue;
                            }
                            if(visiblePartTypes.indexOf(figurePart.type) > -1)
                            {
                                if(animationAction)
                                {
                                    const animationPart = animationAction.getPart(figurePart.type);

                                    if(animationPart)
                                    {
                                        animationFrames = animationPart.frames;
                                    }
                                    else
                                    {
                                        animationFrames = defaultFrames;
                                    }
                                }
                                else
                                {
                                    animationFrames = defaultFrames;
                                }

                                actionDefinition = action.definition;

                                if(activePartTypes.indexOf(figurePart.type) === -1) actionDefinition = this._defaultAction;

                                const partDefinition = this._partSetsData.getPartDefinition(figurePart.type);

                                let flippedPartType = (!partDefinition) ? figurePart.type : partDefinition.flippedSetType;

                                if(!flippedPartType || (flippedPartType === '')) flippedPartType = figurePart.type;

                                if(partColorIds && (partColorIds.length > (figurePart.colorLayerIndex - 1)))
                                {
                                    partColor = palette.getColor(partColorIds[(figurePart.colorLayerIndex - 1)]);
                                }

                                const isColorable = (figurePart.colorLayerIndex > 0);
                                const container = new AvatarImagePartContainer(bodyPartId, figurePart.type, figurePart.id.toString(), partColor, animationFrames, actionDefinition, isColorable, figurePart.paletteMap, flippedPartType);

                                partContainers.push(container);
                            }
                        }
                    }
                }
            }
        }

        const sortedContainers: AvatarImagePartContainer[] = [];

        for(const visiblePartType of visiblePartTypes)
        {
            let overrideColor: IPartColor = null;
            let partFound = false;

            const hasItemOverride = ((itemOverrides) && (itemOverrides.get(visiblePartType)));

            for(const container of partContainers)
            {
                if(container.partType === visiblePartType)
                {
                    if(hasItemOverride)
                    {
                        overrideColor = container.color;
                    }
                    else
                    {
                        partFound = true;

                        if(removes.indexOf(visiblePartType) === -1) sortedContainers.push(container);
                    }
                }
            }

            if(!partFound)
            {
                if(hasItemOverride)
                {
                    const itemId = itemOverrides.get(visiblePartType);

                    let charCodeSum = 0;
                    let charIndex = 0;

                    while(charIndex < itemId.length)
                    {
                        charCodeSum = (charCodeSum + itemId.charCodeAt(charIndex));
                        charIndex++;
                    }

                    if(animationAction)
                    {
                        const animationPart = animationAction.getPart(visiblePartType);

                        if(animationPart)
                        {
                            animationFrames = animationPart.frames;
                        }
                        else
                        {
                            animationFrames = defaultFrames;
                        }
                    }
                    else
                    {
                        animationFrames = defaultFrames;
                    }

                    const container = new AvatarImagePartContainer(bodyPartId, visiblePartType, itemId, overrideColor, animationFrames, action.definition, (!(overrideColor == null)), -1, visiblePartType, false, 1);

                    sortedContainers.push(container);
                }
                else
                {
                    if(activePartTypes.indexOf(visiblePartType) > -1)
                    {
                        const ownerBodyPart = this._geometry.getBodyPartOfItem(geometryType, visiblePartType, avatar);

                        if(bodyPartId !== ownerBodyPart.id)
                        {
                            //
                        }
                        else
                        {
                            const partDefinition = this._partSetsData.getPartDefinition(visiblePartType);

                            let isBlended = false;
                            let blendFactor = 1;

                            if(partDefinition.appendToFigure)
                            {
                                let partId = '1';

                                if(action.actionParameter !== '')
                                {
                                    partId = action.actionParameter;
                                }

                                if(partDefinition.hasStaticId())
                                {
                                    partId = partDefinition.staticId.toString();
                                }

                                if(effectAnimation != null)
                                {
                                    const addData = effectAnimation.getAddData(visiblePartType);

                                    if(addData)
                                    {
                                        isBlended = addData.isBlended;
                                        blendFactor = addData.blend;
                                    }
                                }

                                if(animationAction)
                                {
                                    const animationPart = animationAction.getPart(visiblePartType);

                                    if(animationPart)
                                    {
                                        animationFrames = animationPart.frames;
                                    }
                                    else
                                    {
                                        animationFrames = defaultFrames;
                                    }
                                }
                                else
                                {
                                    animationFrames = defaultFrames;
                                }

                                const container = new AvatarImagePartContainer(bodyPartId, visiblePartType, partId, null, animationFrames, action.definition, false, -1, visiblePartType, isBlended, blendFactor);

                                sortedContainers.push(container);
                            }
                        }
                    }
                }
            }
        }

        return sortedContainers;
    }

    private getPopulatedArray(count: number): number[]
    {
        const result: number[] = [];

        let index = 0;

        while(index < count)
        {
            result.push(index);

            index++;
        }

        return result;
    }

    public getItemIds(): string[]
    {
        if(this._actionManager)
        {
            const params = this._actionManager.getActionDefinition('CarryItem').params;

            const itemIds = [];

            for(const value of params.values()) itemIds.push(value);

            return itemIds;
        }

        return [];
    }

    public get renderManager(): IAvatarRenderManager
    {
        return this._renderManager;
    }

    public get figureData(): IStructureData
    {
        return this._figureData;
    }

    public get partData(): PartSetsData
    {
        return this._partSetsData;
    }

    public get animationManager(): AnimationManager
    {
        return this._animationManager;
    }
}

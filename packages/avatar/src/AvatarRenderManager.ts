import { AvatarSetType, IAssetManager, IAvatarEffectListener, IAvatarFigureContainer, IAvatarImage, IAvatarImageListener, IAvatarRenderManager, IFigureData, IFigurePartSet, IGraphicAsset, IStructureData } from '@octane/api';
import { GetAssetManager } from '@octane/assets';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, OctaneEventType } from '@octane/events';
import { loadGamedata } from '@octane/utils';
import { AvatarAssetDownloadManager } from './AvatarAssetDownloadManager';
import { AvatarFigureContainer } from './AvatarFigureContainer';
import { AvatarFigureShare, AvatarImage } from './AvatarImage';
import { AvatarStructure } from './AvatarStructure';
import { getMissingBundledActions } from './actions/BundledAvatarActions';
import { EffectAssetDownloadManager } from './EffectAssetDownloadManager';
import { FigureDataContainer } from './FigureDataContainer';
import { PlaceHolderAvatarImage } from './PlaceHolderAvatarImage';
import { AssetAliasCollection } from './alias';
import { AvatarAtlasCompositor } from './cache/AvatarAtlasCompositor';
import { AvatarFrameTextureCache } from './cache/AvatarFrameTextureCache';
import { AvatarImageActionCache } from './cache/AvatarImageActionCache';
import { AvatarImageCache } from './cache/AvatarImageCache';
import { HabboAvatarAnimations } from './data/HabboAvatarAnimations';
import { HabboAvatarDanceSixSeven } from './data/HabboAvatarDanceSixSeven';
import { HabboAvatarGeometry } from './data/HabboAvatarGeometry';
import { HabboAvatarPartSets } from './data/HabboAvatarPartSets';

export class AvatarRenderManager implements IAvatarRenderManager
{
    private static DEFAULT_FIGURE: string = 'hd-99999-99999';

    private _structure: AvatarStructure = new AvatarStructure(this);
    private _aliasCollection: AssetAliasCollection = new AssetAliasCollection(this, GetAssetManager());
    private _avatarAssetDownloadManager: AvatarAssetDownloadManager = new AvatarAssetDownloadManager(GetAssetManager(), this._structure);
    private _effectAssetDownloadManager: EffectAssetDownloadManager = new EffectAssetDownloadManager(GetAssetManager(), this._structure);

    private _placeHolderFigure: AvatarFigureContainer = new AvatarFigureContainer(AvatarRenderManager.DEFAULT_FIGURE);
    // Finished avatar frames, shared by every avatar that shows the same composition.
    private _frameTextures: AvatarFrameTextureCache = new AvatarFrameTextureCache();
    private _aliasResetCallback: () => void = null;
    // Avatars whose figure nobody else wears draw into cells of shared atlas pages, always, as in Volt. The room
    // engine can still switch it for a session (setAvatarAtlasMode, from the developer tools).
    private _compositor: AvatarAtlasCompositor = new AvatarAtlasCompositor();
    private _figureShares: Map<string, AvatarFigureShare> = new Map();
    private _atlasEnabled: boolean = true;

    public async init(): Promise<void>
    {

        this._structure?.initGeometry(HabboAvatarGeometry.geometry);
        this._structure?.initPartSets(HabboAvatarPartSets.partSets);

        // Actions and figure data download together. Animations look up action
        // definitions, so the dance and the effect libraries wait for the actions;
        // the avatar libraries only need the figure data later, on demand.
        const actionsLoaded = this.loadActions();
        const figureDataLoaded = this.loadFigureData();

        // Awaited below; this only keeps an early failure of one from being reported as unhandled.
        figureDataLoaded.catch(() => null);

        this._structure?.initAnimation(HabboAvatarAnimations.animations);

        await actionsLoaded;

        this._structure?.registerAnimation({ [HabboAvatarDanceSixSeven.name]: HabboAvatarDanceSixSeven });

        this._aliasCollection.init();

        // Store callback for cleanup
        this._aliasResetCallback = () =>
        {
            this._aliasCollection.reset();
            // The resolved part assets also start over by revision; this keeps the cache small after a load.
            AvatarImageCache.clearResolvedAssets();
        };
        GetEventDispatcher().addEventListener(OctaneEventType.AVATAR_ASSET_LOADED, this._aliasResetCallback);
        GetEventDispatcher().addEventListener(OctaneEventType.AVATAR_EFFECT_LOADED, this._aliasResetCallback);

        await Promise.all([
            figureDataLoaded,
            this._avatarAssetDownloadManager.init(),
            this._effectAssetDownloadManager.init()
        ]);
    }

    public dispose(): void
    {
        // Remove event listeners
        if(this._aliasResetCallback)
        {
            GetEventDispatcher().removeEventListener(OctaneEventType.AVATAR_ASSET_LOADED, this._aliasResetCallback);
            GetEventDispatcher().removeEventListener(OctaneEventType.AVATAR_EFFECT_LOADED, this._aliasResetCallback);
            this._aliasResetCallback = null;
        }

        // Dispose download managers
        this._avatarAssetDownloadManager?.dispose();
        this._effectAssetDownloadManager?.dispose();
        this._frameTextures.dispose();
        this._compositor.dispose();
    }

    private async loadActions(): Promise<void>
    {
        const defaultActions = GetConfiguration().getValue<string>('avatar.default.actions');

        if(defaultActions) this._structure.initActions(GetAssetManager(), defaultActions);

        const url = GetConfiguration().getValue<string>('avatar.actions.url');

        if(!url || !url.length) throw new Error('Missing "avatar.actions.url" in config — add the URL to your renderer-config.json');

        let actions: { actions?: { state?: string }[] };

        try
        {
            actions = await loadGamedata(url);
            this._structure.updateActions(actions);
        }
        catch (err)
        {
            throw new Error(`Could not load avatar actions from "${ url }" — check "avatar.actions.url" in renderer-config.json (${ err?.message || err })`);
        }

        // Postures the hotel's JSON lacks (SnowStorm, cry, vote, typing) come from the bundled actions.
        const missing = getMissingBundledActions(actions);

        if(missing.actions.length) this._structure.updateActions(missing);
    }

    private async loadFigureData(): Promise<void>
    {
        const defaultFigureData = GetConfiguration().getValue<IFigureData>('avatar.default.figuredata');

        if(defaultFigureData) this._structure?.initFigureData(defaultFigureData);

        const url = GetConfiguration().getValue<string>('avatar.figuredata.url');

        if(!url || !url.length) throw new Error('Missing "avatar.figuredata.url" in config — add the URL to your renderer-config.json');

        try
        {
            this._structure.figureData.appendJSON(await loadGamedata(url));
        }
        catch (err)
        {
            throw new Error(`Could not load figure data from "${ url }" — check "avatar.figuredata.url" in renderer-config.json (${ err?.message || err })`);
        }

        this._structure.init();
    }

    public createFigureContainer(figure: string): IAvatarFigureContainer
    {
        return new AvatarFigureContainer(figure);
    }

    public isFigureContainerReady(container: IAvatarFigureContainer): boolean
    {
        if(!this._avatarAssetDownloadManager) return false;

        return this._avatarAssetDownloadManager.isAvatarFigureContainerReady(container);
    }

    public createAvatarImage(figure: string, size: string, gender: string, listener: IAvatarImageListener = null, effectListener: IAvatarEffectListener = null): IAvatarImage
    {
        if(!this._structure || !this._avatarAssetDownloadManager) return null;

        const figureContainer = new AvatarFigureContainer(figure);

        if(gender) this.validateAvatarFigure(figureContainer, gender);

        if(this._avatarAssetDownloadManager.isAvatarFigureContainerReady(figureContainer))
        {
            // Off: no compositor and no figure share, so every frame is a shared frame texture or the avatar's own.
            if(!this._atlasEnabled) return new AvatarImage(this._structure, this._aliasCollection, figureContainer, size, this._effectAssetDownloadManager, effectListener, this._frameTextures);

            return new AvatarImage(this._structure, this._aliasCollection, figureContainer, size, this._effectAssetDownloadManager, effectListener, this._frameTextures, this._compositor, this.getFigureShare(figureContainer.getFigureString(), size));
        }

        this._avatarAssetDownloadManager.downloadAvatarFigure(figureContainer, listener);

        return this.createPlaceholderImage(size);
    }

    public createPlaceholderAvatarImage(size: string): IAvatarImage
    {
        if(!this._structure) return null;

        return this.createPlaceholderImage(size);
    }

    // Every placeholder wears the same figure, so they all share the cached frames (and, with the atlas, its cells).
    private createPlaceholderImage(size: string): PlaceHolderAvatarImage
    {
        if(!this._atlasEnabled) return new PlaceHolderAvatarImage(this._structure, this._aliasCollection, this._placeHolderFigure, size, this._effectAssetDownloadManager, this._frameTextures);

        return new PlaceHolderAvatarImage(this._structure, this._aliasCollection, this._placeHolderFigure, size, this._effectAssetDownloadManager, this._frameTextures, this._compositor, this.getFigureShare(this._placeHolderFigure.getFigureString(), size));
    }

    private getFigureShare(figure: string, size: string): AvatarFigureShare
    {
        const key = `${ size }|${ figure }`;

        let share = this._figureShares.get(key);

        if(!share)
        {
            share = { count: 0 };

            this._figureShares.set(key, share);
        }

        share.count++;

        // Forget figures nobody wears any more, now and then, so the map follows the room.
        if(this._figureShares.size > 8192)
        {
            for(const [ shareKey, value ] of this._figureShares)
            {
                if(value.count <= 0) this._figureShares.delete(shareKey);
            }
        }

        return share;
    }

    // Whether avatar images created from now on may draw into the atlas. Images that exist keep the
    // path they were created with; the room engine recreates the ones it shows (setAvatarAtlasMode).
    public get atlasEnabled(): boolean
    {
        return this._atlasEnabled;
    }

    public set atlasEnabled(enabled: boolean)
    {
        this._atlasEnabled = !!enabled;
        this._compositor.setKeepEmptyPages(this._atlasEnabled);

        AvatarImageActionCache.MAX_DIRECTIONS = this._atlasEnabled ? AvatarImageActionCache.ATLAS_MAX_DIRECTIONS : AvatarImageActionCache.DEFAULT_MAX_DIRECTIONS;
    }

    // How long the last atlas flush took, and how many avatars it drew.
    public get lastCompositionFlushMs(): number
    {
        return (this._compositor?.lastFlushMs ?? 0);
    }

    public get lastCompositionFlushJobs(): number
    {
        return (this._compositor?.lastFlushJobs ?? 0);
    }

    // Draws the avatars that changed this frame into their atlas cells; does nothing when none wait.
    public flushCompositions(): void
    {
        this._compositor?.flush();
    }

    public downloadAvatarFigure(container: IAvatarFigureContainer, listener: IAvatarImageListener): void
    {
        if(!this._avatarAssetDownloadManager) return;

        this._avatarAssetDownloadManager.downloadAvatarFigure(container, listener);
    }

    private validateAvatarFigure(container: AvatarFigureContainer, gender: string): boolean
    {
        let isValid = false;

        const typeIds = this._structure.getMandatorySetTypeIds(gender, 2);

        if(typeIds)
        {
            const figureData = this._structure.figureData;

            for(const id of typeIds)
            {
                if(!container.hasPartType(id))
                {
                    const figurePartSet = this._structure.getDefaultPartSet(id, gender);

                    if(figurePartSet)
                    {
                        container.updatePart(id, figurePartSet.id, [0]);

                        isValid = true;
                    }
                }
                else
                {
                    const setType = figureData.getSetType(id);

                    if(setType)
                    {
                        const figurePartSet = setType.getPartSet(container.getPartSetId(id));

                        if(!figurePartSet)
                        {
                            const partSet = this._structure.getDefaultPartSet(id, gender);

                            if(partSet)
                            {
                                container.updatePart(id, partSet.id, [0]);

                                isValid = true;
                            }
                        }
                    }
                }
            }
        }

        return !(isValid);
    }

    public getFigureClubLevel(container: IAvatarFigureContainer, gender: string, searchParts: string[] = null): number
    {
        if(!this._structure) return 0;

        const figureData = this._structure.figureData;
        const parts = Array.from(container.getPartTypeIds());

        let clubLevel = 0;

        for(const part of parts)
        {
            const set = figureData.getSetType(part);

            if(!set) continue;

            const setId = container.getPartSetId(part);
            const partSet = set.getPartSet(setId);

            if(partSet)
            {
                clubLevel = Math.max(partSet.clubLevel, clubLevel);

                const palette = figureData.getPalette(set.paletteID);
                const colors = container.getPartColorIds(part);

                if(!palette) continue;

                for(const colorId of colors)
                {
                    const color = palette.getColor(colorId);

                    if(!color) continue;

                    clubLevel = Math.max(color.clubLevel, clubLevel);
                }
            }
        }

        if(!searchParts) searchParts = this._structure.getBodyPartsUnordered(AvatarSetType.FULL);

        for(const part of searchParts)
        {
            const set = figureData.getSetType(part);

            if(!set) continue;

            if(parts.indexOf(part) === -1) clubLevel = Math.max(set.optionalFromClubLevel(gender), clubLevel);
        }

        return clubLevel;
    }

    public isValidFigureSetForGender(setId: number, gender: string): boolean
    {
        const structure = this.structureData;
        const partSet = structure.getFigurePartSet(setId);

        return !!(partSet && ((partSet.gender.toUpperCase() === 'U') || (partSet.gender.toUpperCase() === gender.toUpperCase())));
    }

    public getFigureStringWithFigureIds(figure: string, gender: string, setIds: number[]): string
    {
        const container = new FigureDataContainer();

        container.loadAvatarData(figure, gender);

        const partSets: IFigurePartSet[] = this.resolveFigureSets(setIds);

        for(const partSet of partSets)
        {
            container.savePartData(partSet.type, partSet.id, container.getColourIds(partSet.type));
        }

        return container.getFigureString();
    }

    private resolveFigureSets(setIds: number[]): IFigurePartSet[]
    {
        const structure = this.structureData;
        const partSets: IFigurePartSet[] = [];

        for(const setId of setIds)
        {
            const partSet = structure.getFigurePartSet(setId);

            if(partSet) partSets.push(partSet);
        }

        return partSets;
    }

    public getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[]
    {
        if(!this._structure) return null;

        return this._structure.getMandatorySetTypeIds(gender, clubLevel);
    }

    public getAssetByName(name: string): IGraphicAsset
    {
        return this._aliasCollection.getAsset(name);
    }

    public get assets(): IAssetManager
    {
        return GetAssetManager();
    }

    public get structure(): AvatarStructure
    {
        return this._structure;
    }

    public get structureData(): IStructureData
    {
        if(this._structure) return this._structure.figureData;

        return null;
    }

    public get downloadManager(): AvatarAssetDownloadManager
    {
        return this._avatarAssetDownloadManager;
    }
}

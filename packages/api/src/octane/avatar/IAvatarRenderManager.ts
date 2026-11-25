import { IAssetManager, IGraphicAsset } from '../../asset';
import { IAvatarEffectListener } from './IAvatarEffectListener';
import { IAvatarFigureContainer } from './IAvatarFigureContainer';
import { IAvatarImage } from './IAvatarImage';
import { IAvatarImageListener } from './IAvatarImageListener';
import { IStructureData } from './structure';

export interface IAvatarRenderManager
{
    init(): Promise<void>;
    createFigureContainer(figure: string): IAvatarFigureContainer;
    isFigureContainerReady(container: IAvatarFigureContainer): boolean;
    createAvatarImage(figure: string, size: string, gender: string, listener?: IAvatarImageListener, effectListener?: IAvatarEffectListener): IAvatarImage;
    /** The grey placeholder silhouette, also used for blocked users. */
    createPlaceholderAvatarImage(size: string): IAvatarImage;
    downloadAvatarFigure(container: IAvatarFigureContainer, listener: IAvatarImageListener): void;
    getFigureClubLevel(container: IAvatarFigureContainer, gender: string, searchParts?: string[]): number;
    isValidFigureSetForGender(setId: number, gender: string): boolean;
    getFigureStringWithFigureIds(figure: string, gender: string, figureIds: number[]): string;
    getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[];
    getAssetByName(name: string): IGraphicAsset;
    /** Whether new avatar images draw into the shared avatar atlas (always, unless a developer switched it off). */
    atlasEnabled: boolean;
    /** How long the last atlas flush took (ms) and how many avatars it drew. */
    readonly lastCompositionFlushMs: number;
    readonly lastCompositionFlushJobs: number;
    /** Draws the avatars that changed this frame into the atlas; the room engine calls it before the stage renders. */
    flushCompositions(): void;
    assets: IAssetManager;
    structureData: IStructureData;
}

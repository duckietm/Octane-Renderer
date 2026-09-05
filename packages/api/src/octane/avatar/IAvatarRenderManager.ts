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
    downloadAvatarFigure(container: IAvatarFigureContainer, listener: IAvatarImageListener): void;
    getFigureClubLevel(container: IAvatarFigureContainer, gender: string, searchParts?: string[]): number;
    isValidFigureSetForGender(setId: number, gender: string): boolean;
    getFigureStringWithFigureIds(figure: string, gender: string, figureIds: number[]): string;
    getMandatoryAvatarPartSetIds(gender: string, clubLevel: number): string[];
    getAssetByName(name: string): IGraphicAsset;
    assets: IAssetManager;
    structureData: IStructureData;
}

import { IAssetAnimation } from '../../asset';

export interface IEffectAssetDownloadLibrary
{
    downloadAsset(): Promise<void>;
    readonly libraryName: string;
    readonly animation: { [index: string]: IAssetAnimation };
    readonly isLoaded: boolean;
}

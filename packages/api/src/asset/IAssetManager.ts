
import { Spritesheet, Texture } from 'pixi.js';
import { IAssetData } from './IAssetData';
import { IGraphicAsset } from './IGraphicAsset';
import { IGraphicAssetCollection } from './IGraphicAssetCollection';

export interface IAssetManager
{
    getTexture(name: string): Texture;
    setTexture(name: string, texture: Texture): void;
    addAssetToCollection(collectionName: string, assetName: string, texture: Texture, override?: boolean): boolean;
    getAsset(name: string): IGraphicAsset;
    getCollection(name: string): IGraphicAssetCollection;
    createCollection(data: IAssetData, spritesheet: Spritesheet): IGraphicAssetCollection;
    downloadAssets(urls: string[]): Promise<boolean>;
    downloadAsset(url: string): Promise<boolean>;
    /** Settles once the room library's images decoded after the boot (the landscapes) are in. */
    whenRoomAssetsReady?(): Promise<void>;
    readonly collections: Map<string, IGraphicAssetCollection>;
    // Changes whenever an asset name starts or stops resolving (collections loaded or replaced, assets added or removed).
    readonly assetRevision?: number;
}

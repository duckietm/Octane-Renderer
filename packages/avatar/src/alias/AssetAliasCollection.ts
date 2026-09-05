import { IAssetManager, IGraphicAsset } from '@octane/api';
import { AvatarRenderManager } from '../AvatarRenderManager';
import { AssetAlias } from './AssetAlias';

export class AssetAliasCollection
{
    private _assets: IAssetManager;
    private _aliases: Map<string, AssetAlias>;
    private _avatarRenderManager: AvatarRenderManager;
    private _missingAssetNames: string[];

    constructor(avatarRenderManager: AvatarRenderManager, assets: IAssetManager)
    {
        this._avatarRenderManager = avatarRenderManager;
        this._aliases = new Map();
        this._assets = assets;
        this._missingAssetNames = [];
    }

    public dispose(): void
    {
        this._assets = null;
        this._aliases = null;
    }

    public reset(): void
    {
        this.init();
    }

    public init(): void
    {
        for(const collection of this._assets.collections.values())
        {
            if(!collection) continue;

            const aliases = collection.data && collection.data.aliases;

            if(!aliases) continue;

            for(const name in aliases)
            {
                const alias = aliases[name];

                if(!alias) continue;

                this._aliases.set(name, new AssetAlias(name, alias));
            }
        }
    }

    public hasAlias(name: string): boolean
    {
        const alias = this._aliases.get(name);

        if(alias) return true;

        return false;
    }

    public getAssetName(name: string): string
    {
        let resolvedName = name;
        let remainingHops = 5;

        while(this.hasAlias(resolvedName) && (remainingHops >= 0))
        {
            const alias = this._aliases.get(resolvedName);

            if(!alias || !alias.link) break;

            resolvedName = alias.link;
            remainingHops--;
        }

        return resolvedName;
    }

    public getAsset(name: string): IGraphicAsset
    {
        if(!this._assets) return null;

        name = this.getAssetName(name);

        const asset = this._assets.getAsset(name);

        if(!asset) return null;

        return asset;
    }
}

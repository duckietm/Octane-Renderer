import { OctaneLogger, TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

export class TexturePool
{
    private static MAX_IDLE: number = 1800;
    private static MAX_POOL_SIZE: number = 200;

    private _textures: { [index: string]: { [index: string]: Texture[] } } = {};
    private _totalTextures: number = 0;
    private _runCount: number = 0;

    public getTotalTextures(): number
    {
        let total = 0;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                total += this._textures[width][height].length;
            }
        }

        this._totalTextures = total;

        return this._totalTextures;
    }

    public getTexture(width: number, height: number): Texture
    {
        if(!this._textures[width]) this._textures[width] = {};

        if(!this._textures[width][height]) this._textures[width][height] = [];

        if(this._textures[width][height].length)
        {
            const texture = this._textures[width][height].shift();

            if(texture)
            {
                this._totalTextures--;

                return texture;
            }
        }

        return TextureUtils.createRenderTexture(width, height);
    }

    public putTexture(texture: Texture)
    {
        if(!texture || texture.destroyed || !texture.source) return;

        if(this._totalTextures >= TexturePool.MAX_POOL_SIZE)
        {
            delete texture.source.hitMap;
            delete texture.source.hitMapDirty;

            if(!texture.destroyed) texture.destroy(true);

            return;
        }

        if(!this._textures[texture.width]) this._textures[texture.width] = {};

        if(!this._textures[texture.width][texture.height]) this._textures[texture.width][texture.height] = [];

        delete texture.source.hitMap;
        delete texture.source.hitMapDirty;

        this._textures[texture.width][texture.height].push(texture);

        this._totalTextures++;
    }

    public run(): void
    {
        this._runCount++;

        if(!this._totalTextures) return;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                const textures = this._textures[width][height];

                for(let i = textures.length - 1; i >= 0; i--)
                {
                    const texture = textures[i];
                    const source = texture.source;

                    if((source._touched > -1) && (this._runCount - source._touched) > TexturePool.MAX_IDLE)
                    {
                        delete texture.source.hitMap;
                        delete texture.source.hitMapDirty;

                        if(!source.destroyed) texture.destroy(true);

                        this._textures[texture.width][texture.height].splice(i, 1);

                        this._totalTextures--;
                    }
                }
            }
        }
    }

    public get textures(): { [index: string]: { [index: string]: Texture[] } }
    {
        return this._textures;
    }
}

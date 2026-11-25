// Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
import { GetRenderer } from '@octane/utils';
import { Renderer, RenderTexture, Sprite, Texture } from 'pixi.js';

interface ScaledTexture
{
    source: Texture;
    texture: RenderTexture;
    references: number;
}

/** One immutable small-scale fallback per atlas texture, shared by all live avatars. */
export class AvatarScaleTextureCache
{
    private static _sources = new Map<Texture, ScaledTexture>();
    private static _views = new WeakMap<Texture, ScaledTexture>();
    private static _renderer: Renderer = null;

    public static acquire(source: Texture): Texture
    {
        if(!source || source.destroyed || !source.source || source.source.destroyed) return null;

        let entry = this._sources.get(source);

        if(!entry)
        {
            const renderer = GetRenderer();
            if(!renderer) return null;

            const texture = RenderTexture.create({
                width: Math.max(1, Math.round(source.orig.width / 2)),
                height: Math.max(1, Math.round(source.orig.height / 2))
            });
            entry = { source, texture, references: 0 };

            try
            {
                this.draw(entry);
            }
            catch (error)
            {
                texture.destroy(true); throw error;
            }

            if(!this._sources.size)
            {
                this._renderer = renderer;
                renderer.runners.contextChange.add(this);
            }
            this._sources.set(source, entry);
            this._views.set(texture, entry);
        }

        entry.references++;
        return entry.texture;
    }

    private static draw(entry: ScaledTexture): void
    {
        const sprite = new Sprite(entry.source);
        sprite.width = entry.texture.width;
        sprite.height = entry.texture.height;
        try
        {
            GetRenderer().render({ container: sprite, target: entry.texture, clear: true });
        }
        finally
        {
            sprite.destroy();
        }
    }

    public static contextChange(): void
    {
        // Render targets lose their pixels with the GL context. Rebuild from the original atlas.
        for(const entry of this._sources.values()) this.draw(entry);
    }

    public static isImmutable(texture: Texture): boolean
    {
        return this._views.has(texture);
    }

    public static release(texture: Texture): void
    {
        const entry = this._views.get(texture);
        if(!entry || --entry.references) return;

        this._sources.delete(entry.source);
        this._views.delete(texture);
        texture.destroy(true);

        if(!this._sources.size)
        {
            this._renderer?.runners.contextChange.remove(this);
            this._renderer = null;
        }
    }
}

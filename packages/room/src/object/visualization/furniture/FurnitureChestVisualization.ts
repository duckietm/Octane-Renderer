import { RoomObjectVariable } from '@nitrots/api';
import { Assets, Texture } from 'pixi.js';
import { GetRoomEngine } from '../../../GetRoomEngine';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

/**
 * A wired chest: ordinary animated furniture, plus the two things a chest has of its own.
 *
 * <p>Its asset carries a layer tagged `wired_emblem` — the mark that says this chest is part of the
 * room's machinery rather than a box. It was drawn on every chest whether it meant anything or not,
 * because until a chest could be told apart, every one of them answered wired. Now it shows exactly
 * when it is true.
 *
 * <p>And a chest can show some of what it holds, sitting on its lid. Those items are not in the
 * chest's own spritesheet — they are whatever somebody put inside — so they arrive as furnidata ids
 * in the chest's data, are fetched as icons and registered as assets, and are drawn on layers added
 * beyond the ones the asset declares.
 */
export class FurnitureChestVisualization extends FurnitureAnimatedVisualization
{
    private static readonly WIRED_EMBLEM_TAG: string = 'wired_emblem';

    /** Keys the server puts in the chest's furni data. */
    private static readonly WIRED_ENABLED_KEY: string = 'is_wired_enabled';
    private static readonly PREVIEW_ITEMS_KEY: string = 'preview_items';

    /** The lid has room for four. */
    private static readonly MAX_PREVIEW_ITEMS: number = 4;

    /** Where the row of previewed items sits relative to the chest's own origin. */
    private static readonly PREVIEW_Y_OFFSET: number = -46;
    private static readonly PREVIEW_SPACING: number = 15;
    private static readonly PREVIEW_SIZE: number = 24;

    private _previewIds: string = '';
    private _previewAssetNames: string[] = [];

    protected getAdditionalLayerCount(): number
    {
        return super.getAdditionalLayerCount() + FurnitureChestVisualization.MAX_PREVIEW_ITEMS;
    }

    protected updateModel(scale: number): boolean
    {
        const needsUpdate = super.updateModel(scale);
        const ids = this.readData(FurnitureChestVisualization.PREVIEW_ITEMS_KEY, '');

        if(ids === this._previewIds) return needsUpdate;

        this._previewIds = ids;
        this._previewAssetNames = [];

        // Fetching is asynchronous; each icon asks for a redraw as it lands, so a slow one does not
        // hold up the other three.
        const typeIds = ids.split(',').filter(id => id.length).slice(0, FurnitureChestVisualization.MAX_PREVIEW_ITEMS);

        typeIds.forEach((typeId, index) => this.loadPreviewIcon(parseInt(typeId, 10), index));

        this.updateObjectCounter = -1;

        return true;
    }

    private async loadPreviewIcon(typeId: number, index: number): Promise<void>
    {
        if(isNaN(typeId) || (typeId <= 0) || !this.asset) return;

        const url = GetRoomEngine()?.getFurnitureFloorIconUrl(typeId);

        if(!url) return;

        const name = `chest_preview_${ typeId }`;

        try
        {
            if(!this.asset.getAsset(name))
            {
                const texture = await Assets.load<Texture>(url);

                if(!texture || !this.asset) return;

                this.asset.addAsset(name, texture, true, 0, 0, false, false);
            }
        }
        catch
        {
            // A furni whose icon will not load simply is not previewed. The chest still draws.
            return;
        }

        this._previewAssetNames[index] = name;
        this.updateObjectCounter = -1;
    }

    protected getSpriteAssetName(scale: number, layerId: number): string
    {
        const previewIndex = this.previewIndexOf(scale, layerId);

        if(previewIndex < 0) return super.getSpriteAssetName(scale, layerId);

        const name = this._previewAssetNames[previewIndex];

        if(!name) return super.getSpriteAssetName(scale, layerId);

        const asset = this.getAsset(name, layerId);

        if(!asset || !asset.texture) return super.getSpriteAssetName(scale, layerId);

        return name;
    }

    protected getLayerXOffset(scale: number, direction: number, layerId: number): number
    {
        const previewIndex = this.previewIndexOf(scale, layerId);

        if(previewIndex < 0) return super.getLayerXOffset(scale, direction, layerId);

        const shown = this.shownPreviewCount();
        const spacing = this.scaled(scale, FurnitureChestVisualization.PREVIEW_SPACING);

        // Centre the row on the chest, whether there is one item on it or four.
        const centred = (previewIndex - ((shown - 1) / 2)) * spacing;

        return Math.round(centred - (this.scaled(scale, FurnitureChestVisualization.PREVIEW_SIZE) / 2));
    }

    protected getLayerYOffset(scale: number, direction: number, layerId: number): number
    {
        const previewIndex = this.previewIndexOf(scale, layerId);

        if(previewIndex < 0) return super.getLayerYOffset(scale, direction, layerId);

        return this.scaled(scale, FurnitureChestVisualization.PREVIEW_Y_OFFSET);
    }

    protected updateSprite(scale: number, layerId: number): void
    {
        super.updateSprite(scale, layerId);

        const sprite = this.getSprite(layerId);

        if(!sprite) return;

        if(this.getLayerTag(scale, this.direction, layerId) === FurnitureChestVisualization.WIRED_EMBLEM_TAG)
        {
            sprite.visible = this.answersWired();
            return;
        }

        const previewIndex = this.previewIndexOf(scale, layerId);

        if(previewIndex < 0) return;

        const name = this._previewAssetNames[previewIndex];

        sprite.visible = !!name;

        if(!name) return;

        sprite.alpha = 255;
        sprite.color = 0xFFFFFF;

        // Icons are drawn at their own size; bring them down to something that sits on a lid.
        const asset = this.getAsset(name, layerId);

        if(asset?.texture?.width) sprite.scale = (this.scaled(scale, FurnitureChestVisualization.PREVIEW_SIZE) / asset.texture.width);

        // In front of the chest's own layers, which top out at z 500.
        sprite.relativeDepth = -0.01 - (previewIndex * 0.001);
    }

    /** Which preview slot a layer is, or -1 when it is one of the chest's own layers. */
    private previewIndexOf(scale: number, layerId: number): number
    {
        const ownLayers = (this._data?.getLayerCount(scale) || 0);
        const index = layerId - ownLayers;

        if((index < 0) || (index >= FurnitureChestVisualization.MAX_PREVIEW_ITEMS)) return -1;

        return index;
    }

    private shownPreviewCount(): number
    {
        return Math.max(1, this._previewAssetNames.filter(name => !!name).length);
    }

    private scaled(scale: number, value: number): number
    {
        return (scale === 32) ? (value * 0.5) : value;
    }

    /**
     * Whether this chest answers wired, from its own furni data.
     *
     * <p>A chest whose data says nothing is served by a server from before the upgrade existed, where
     * every chest did answer wired — so silence reads as yes, the same way the parser reads it.
     */
    private answersWired(): boolean
    {
        return this.readData(FurnitureChestVisualization.WIRED_ENABLED_KEY, '1') !== '0';
    }

    private readData(key: string, fallback: string): string
    {
        const data = this.object?.model?.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);

        if(!data) return fallback;

        const value = data[key];

        return ((value === undefined) || (value === null)) ? fallback : value;
    }
}

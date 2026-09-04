import { RoomObjectVariable } from '@nitrots/api';
import { Assets, Texture } from 'pixi.js';
import { GetRoomEngine } from '../../../GetRoomEngine';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

/**
 * A wired chest: ordinary animated furniture, plus the two things a chest has of its own.
 *
 * <p>Its asset carries a layer tagged `wired_emblem` — the mark that says this chest is part of the
 * room's machinery rather than a box. It was drawn on every chest whether it meant anything or not,
 * because until a chest could be told apart, every one of them answered wired.
 *
 * <p>And an open chest floats a few of the things inside it above the lid. Those items are not in the
 * chest's own spritesheet — they are whatever somebody put inside — so they arrive as furnidata ids,
 * are fetched as icons, and are drawn on sprites added beyond the ones the asset declares. The
 * layout, the drift and the way they fade with height follow the official client.
 */
export class FurnitureChestVisualization extends FurnitureAnimatedVisualization
{
    private static readonly WIRED_EMBLEM_TAG: string = 'wired_emblem';
    private static readonly FLOATING_ICON_TAG_PREFIX: string = 'floating_icon_';

    /** Keys the server puts in the chest's furni data. */
    private static readonly WIRED_ENABLED_KEY: string = 'is_wired_enabled';
    private static readonly VISUALS_KEY: string = 'visuals';

    private static readonly MAX_ICONS: number = 4;

    /** Icons are only drawn at full size; at half scale there is no room for them. */
    private static readonly ICON_SCALE: number = 64;

    /** How far an icon drifts, and how long a step of that drift lasts. */
    private static readonly FLOATING_PIXELS: number = 2;
    private static readonly FLOAT_INTERVAL: number = 300;

    /**
     * Where each icon sits, by how many are shown: [x, y, xSpread, ySpread].
     *
     * <p>Straight from the official client. The spreads are a random nudge applied once, so two chests
     * side by side do not look stamped from the same mould.
     */
    private static readonly ICON_POSITIONING: number[][][] = [
        [],
        [[0, -68, 17, 17]],
        [[16, -70, 4, 4], [-14, -59, 4, 4]],
        [[12, -52, 2, 2], [-17, -70, 3, 2], [17, -87, 7, 2]],
        [[14, -50, 2, 2], [-14, -59, 2, 2], [19, -78, 4, 2], [-20, -90, 4, 2]]
    ];

    private _lastVisuals: string = '';
    private _iconAssetNames: string[] = [];
    private _icons: { x: number; y: number; width: number; height: number; alpha: number; z: number }[] = [];
    private _mirrored: boolean = false;
    private _floatStep: number = 0;
    private _lastFloatUpdate: number = -1;

    protected getAdditionalLayerCount(): number
    {
        return super.getAdditionalLayerCount() + FurnitureChestVisualization.MAX_ICONS;
    }

    protected updateModel(scale: number): boolean
    {
        const needsUpdate = super.updateModel(scale);

        // Only an open chest shows what is inside it, which the official reads off the state being
        // odd -- for a furni chest that is the raised lid, and for a coin chest the piles of gold.
        const open = ((this.object?.getState(0) ?? 0) % 2) === 1;
        const visuals = (open && (scale === FurnitureChestVisualization.ICON_SCALE))
            ? this.readData(FurnitureChestVisualization.VISUALS_KEY, '')
            : '';

        if(visuals === this._lastVisuals) return needsUpdate;

        this._lastVisuals = visuals;
        this._iconAssetNames = [];
        this._icons = [];

        const entries = visuals.split(';').filter(entry => entry.length).slice(0, FurnitureChestVisualization.MAX_ICONS);

        this.layOutIcons(entries.length);

        entries.forEach((entry, index) => void this.loadIcon(entry, index));

        this.updateObjectCounter = -1;

        return true;
    }

    public update(geometry: any, time: number, update: boolean, skipUpdate: boolean): void
    {
        // The drift: a step every 300ms, four steps folded into an up-and-back so the icons breathe
        // rather than snapping back down. Asking for a redraw here is what makes them move at all.
        if(this._icons.length)
        {
            if((this._lastFloatUpdate < 0) || ((time - this._lastFloatUpdate) > FurnitureChestVisualization.FLOAT_INTERVAL))
            {
                this._lastFloatUpdate = time;
                this._floatStep = (this._floatStep + 1) % (FurnitureChestVisualization.FLOATING_PIXELS * 2);
                this.updateObjectCounter = -1;
            }
        }

        super.update(geometry, time, update, skipUpdate);
    }

    /** Place the icons for a given count, nudged so no two chests look identical. */
    private layOutIcons(count: number): void
    {
        const positions = FurnitureChestVisualization.ICON_POSITIONING[count] ?? [];

        this._mirrored = Math.random() < 0.5;
        this._floatStep = 0;

        this._icons = positions.map(([x, y, xSpread, ySpread]) =>
        {
            const nudgedX = Math.round(x + (Math.random() * (xSpread + 1)) - (xSpread / 2));
            const nudgedY = Math.round(y + (Math.random() * (ySpread + 1)) - (ySpread / 2));

            return {
                x: nudgedX,
                y: nudgedY,
                width: 0,
                height: 0,
                alpha: this.alphaForHeight(nudgedY),
                z: 0.001 + (nudgedY / 10000)
            };
        });
    }

    /**
     * The higher an icon floats, the fainter it is: 0.9 at the lid, down to 0.4 well above it.
     */
    private alphaForHeight(y: number): number
    {
        const near = -40;
        const far = -100;
        const nearAlpha = 0.9;
        const farAlpha = 0.4;

        const along = (y - near) / (far - near);
        const alpha = nearAlpha + ((farAlpha - nearAlpha) * along);

        return Math.min(Math.max(alpha, farAlpha), nearAlpha);
    }

    /** `visuals` entries look like `isWallItem,typeId[,extra]`, the way the official writes them. */
    private async loadIcon(entry: string, index: number): Promise<void>
    {
        const parts = entry.split(',');
        const wallItem = parts[0] === 'true';
        const typeId = parseInt(parts[1], 10);

        if(isNaN(typeId) || (typeId <= 0) || !this.asset) return;

        const roomEngine = GetRoomEngine();
        const url = wallItem ? roomEngine?.getFurnitureWallIconUrl(typeId) : roomEngine?.getFurnitureFloorIconUrl(typeId);

        if(!url) return;

        const name = `chest_icon_${ wallItem ? 'w' : 'f' }_${ typeId }`;

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
            // An icon that will not load simply is not shown. The chest still draws.
            return;
        }

        const asset = this.asset.getAsset(name);
        const icon = this._icons[index];

        if(icon && asset)
        {
            icon.width = asset.width;
            icon.height = asset.height;
        }

        this._iconAssetNames[index] = name;
        this.updateObjectCounter = -1;
    }

    /** Which floating slot a layer is, or -1 when it is one of the chest's own. */
    private iconIndexOf(layerId: number): number
    {
        const index = layerId - this.totalSprites + FurnitureChestVisualization.MAX_ICONS;

        if((index < 0) || (index >= this._icons.length)) return -1;

        return index;
    }

    protected getSpriteAssetName(scale: number, layerId: number): string
    {
        const index = this.iconIndexOf(layerId);

        if((index < 0) || (scale !== FurnitureChestVisualization.ICON_SCALE)) return super.getSpriteAssetName(scale, layerId);

        return this._iconAssetNames[index] ?? super.getSpriteAssetName(scale, layerId);
    }

    protected getLayerTag(scale: number, direction: number, layerId: number): string
    {
        const index = this.iconIndexOf(layerId);

        if(index < 0) return super.getLayerTag(scale, direction, layerId);

        return FurnitureChestVisualization.FLOATING_ICON_TAG_PREFIX + index;
    }

    protected getLayerAlpha(scale: number, direction: number, layerId: number): number
    {
        const index = this.iconIndexOf(layerId);
        const alpha = super.getLayerAlpha(scale, direction, layerId);

        if(index < 0) return alpha;

        return (this._icons[index].alpha * alpha);
    }

    protected getLayerXOffset(scale: number, direction: number, layerId: number): number
    {
        const index = this.iconIndexOf(layerId);

        if(index < 0) return super.getLayerXOffset(scale, direction, layerId);

        const icon = this._icons[index];
        const facingOther = ((direction / 2) % 2) === 1;

        // Mirrored per chest and per facing, so a row of chests does not read as a repeated pattern.
        const x = (this._mirrored !== facingOther) ? -icon.x : icon.x;

        return Math.round(x - (icon.width / 2));
    }

    protected getLayerYOffset(scale: number, direction: number, layerId: number): number
    {
        const index = this.iconIndexOf(layerId);

        if(index < 0) return super.getLayerYOffset(scale, direction, layerId);

        const icon = this._icons[index];

        // Fold 0,1,2,3 into 0,1,2,1 so the drift goes up and comes back rather than snapping.
        let step = this._floatStep;
        if(step > FurnitureChestVisualization.FLOATING_PIXELS) step = (FurnitureChestVisualization.FLOATING_PIXELS * 2) - step;

        return Math.round(icon.y + (icon.height / 2) - step);
    }

    protected getLayerZOffset(scale: number, direction: number, layerId: number): number
    {
        const index = this.iconIndexOf(layerId);

        if(index < 0) return super.getLayerZOffset(scale, direction, layerId);

        return this._icons[index].z;
    }

    protected getLayerIgnoreMouse(scale: number, direction: number, layerId: number): boolean
    {
        if(this.iconIndexOf(layerId) >= 0) return true;

        return super.getLayerIgnoreMouse(scale, direction, layerId);
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

        const index = this.iconIndexOf(layerId);

        if(index < 0) return;

        sprite.visible = !!this._iconAssetNames[index];
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

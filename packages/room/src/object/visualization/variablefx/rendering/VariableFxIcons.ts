import { readVariableFxExtra, VariableFxIconAlignment } from '../VariableFxTypes';
import { IVariableFxAssetProvider } from './VariableFxAssetProvider';
import { IVariableFxImage } from './VariableFxBitmap';

/**
 * How far each icon is moved from its default place: AIR's variablefx/icons/icons.xml (asset
 * variablefx_icon_metadata) as data. Icons not listed sit at 0, 0.
 */
export const VARIABLE_FX_ICON_METADATA: Readonly<Record<string, { x: number, y: number }>> = {
    energy: { x: 2, y: 1 },
    food: { x: 2, y: 0 },
    poison: { x: -1, y: 1 },
    health: { x: 2, y: -1 },
    honor: { x: 2, y: 0 },
    reputation: { x: -1, y: 0 },
    cooldown: { x: 0, y: 1 },
    timeleft: { x: 0, y: 1 },
    burning: { x: -1, y: 0 },
    droplet: { x: -1, y: 0 },
    battery: { x: -2, y: 0 },
    repairing: { x: 4, y: -1 },
    stealth: { x: 1, y: 0 },
    gems: { x: 1, y: 1 },
    star_power: { x: 0, y: -1 },
    magic: { x: 0, y: 1 },
    mana: { x: 0, y: 1 },
    cash: { x: 0, y: 0 },
    fish: { x: 0, y: 0 },
    wooden_logs: { x: 0, y: 0 },
    misc_heart: { x: 0, y: 0 },
    misc_skull: { x: 3, y: 0 },
    'xmas26.snowman': { x: 0, y: -1 }
};

export const VARIABLE_FX_ICON_ASSET_PREFIX = 'variablefx_icon_';

export interface IVariableFxIconDefinition
{
    name: string;
    assetName: string;
    offsetX: number;
    offsetY: number;
}

export const resolveVariableFxIconDefinition = (icon: string): IVariableFxIconDefinition =>
{
    const name = (icon ?? '').trim();
    const metadata = VARIABLE_FX_ICON_METADATA[name];

    return {
        name,
        assetName: (VARIABLE_FX_ICON_ASSET_PREFIX + name.replace(/\./g, '_')),
        offsetX: (metadata ? (metadata.x | 0) : 0),
        offsetY: (metadata ? (metadata.y | 0) : 0)
    };
};

/** A placed copy of the icon. */
export interface IVariableFxPoint
{
    x: number;
    y: number;
}

/**
 * Where an icon sits beside a bar or number and how big that makes the frame (AIR's
 * VariableFxIconOverlayLayout): the icon overlaps the content's left edge by `overlap` px (right
 * aligned: its right edge), is centred vertically, and the content moves right and down so nothing
 * sticks out of the frame. "double" puts one at each end.
 */
export class VariableFxIconOverlayLayout
{
    public contentX: number = 0;
    public contentY: number = 0;
    public frameWidth: number = 0;
    public frameHeight: number = 0;
    public hasIcon: boolean = false;
    public placements: IVariableFxPoint[] = [];
    public iconX: number = 0;
    public iconY: number = 0;

    public static resolve(options: { alignment: string, contentWidth: number, contentHeight: number, contentOffsetY: number, iconWidth: number, iconHeight: number, iconOffsetX: number, iconOffsetY: number, overlap: number }): VariableFxIconOverlayLayout
    {
        const layout = new VariableFxIconOverlayLayout();
        const contentWidth = Math.max(0, (options.contentWidth | 0));
        const contentHeight = Math.max(0, (options.contentHeight | 0));
        const iconWidth = Math.max(0, (options.iconWidth | 0));
        const iconHeight = Math.max(0, (options.iconHeight | 0));
        const overlap = (options.overlap | 0);
        const contentOffsetY = ((options.contentOffsetY ?? 0) | 0);
        const iconOffsetX = ((options.iconOffsetX ?? 0) | 0);
        const iconOffsetY = ((options.iconOffsetY ?? 0) | 0);
        const alignment = (options.alignment ?? VariableFxIconAlignment.LEFT);

        layout.hasIcon = ((iconWidth > 0) && (iconHeight > 0));

        if(!layout.hasIcon)
        {
            layout.frameWidth = contentWidth;
            layout.frameHeight = contentHeight;

            return layout;
        }

        const contentX = ((alignment === VariableFxIconAlignment.RIGHT) ? 0 : Math.max(0, (iconWidth - overlap)));
        const height = Math.max(contentHeight, iconHeight);
        const contentY = Math.max(0, (Math.trunc((height - contentHeight) / 2) + contentOffsetY));
        const iconY = (Math.trunc((height - iconHeight) / 2) + iconOffsetY);
        const placements = VariableFxIconOverlayLayout.resolveDefaultPlacements(alignment, contentX, contentWidth, iconOffsetX, iconY, overlap);
        const shiftX = Math.max(0, -Math.min(contentX, Math.min(...placements.map(point => point.x))));
        const shiftY = Math.max(0, -Math.min(contentY, Math.min(...placements.map(point => point.y))));

        layout.contentX = (contentX + shiftX);
        layout.contentY = (contentY + shiftY);
        layout.placements = placements.map(point => ({ x: ((point.x + shiftX) | 0), y: ((point.y + shiftY) | 0) }));
        layout.iconX = layout.placements[0].x;
        layout.iconY = layout.placements[0].y;
        layout.frameHeight = Math.max((layout.contentY + contentHeight), Math.max(...layout.placements.map(point => (point.y + iconHeight))));
        layout.frameWidth = Math.max((layout.contentX + contentWidth), Math.max(...layout.placements.map(point => (point.x + iconWidth))));

        return layout;
    }

    private static resolveDefaultPlacements(alignment: string, contentX: number, contentWidth: number, offsetX: number, y: number, overlap: number): IVariableFxPoint[]
    {
        const left = { x: offsetX, y };
        const right = { x: (contentX + contentWidth - overlap - offsetX), y };

        switch(alignment)
        {
            case VariableFxIconAlignment.RIGHT: return [ right ];
            case VariableFxIconAlignment.DOUBLE: return [ left, right ];
            default: return [ left ];
        }
    }
}

/** The icon a config asks for, with its bitmap (AIR's VariableFxConfiguredIcon). */
export class VariableFxConfiguredIcon
{
    public static ICON_CONFIG_EXTRA_KEY: string = 'icon';
    public static ICON_ALIGNMENT_CONFIG_EXTRA_KEY: string = 'icon_alignment';
    public static BAR_ICON_OVERLAP_PX: number = 5;
    public static BAR_ICON_CONTENT_Y_OFFSET_PX: number = 2;

    constructor(
        public readonly bitmap: IVariableFxImage,
        public readonly definition: IVariableFxIconDefinition)
    {}

    /** Null when the config has no icon; throws when the icon's bitmap is missing, as AIR does. */
    public static resolve(configExtra: Record<string, string>, assets: IVariableFxAssetProvider): VariableFxConfiguredIcon
    {
        const icon = readVariableFxExtra(configExtra, VariableFxConfiguredIcon.ICON_CONFIG_EXTRA_KEY);

        if(!icon) return null;

        const definition = resolveVariableFxIconDefinition(icon);
        const bitmap = (assets ? assets.getBitmap(definition.assetName) : null);

        if(!bitmap) throw new Error(`Missing Variable FX icon layer '${ definition.assetName }'.`);

        return new VariableFxConfiguredIcon(bitmap, definition);
    }

    public static resolveAlignment(configExtra: Record<string, string>): string
    {
        const alignment = readVariableFxExtra(configExtra, VariableFxConfiguredIcon.ICON_ALIGNMENT_CONFIG_EXTRA_KEY);

        switch(alignment)
        {
            case VariableFxIconAlignment.RIGHT:
            case VariableFxIconAlignment.DOUBLE:
                return alignment;
            default:
                return VariableFxIconAlignment.LEFT;
        }
    }

    public static resolveBarIconOverlayLayout(contentWidth: number, contentHeight: number, icon: VariableFxConfiguredIcon, alignment: string = VariableFxIconAlignment.LEFT, contentOffsetY: number = VariableFxConfiguredIcon.BAR_ICON_CONTENT_Y_OFFSET_PX): VariableFxIconOverlayLayout
    {
        return VariableFxIconOverlayLayout.resolve({
            alignment,
            contentWidth,
            contentHeight,
            contentOffsetY,
            iconWidth: (icon ? icon.bitmap.width : 0),
            iconHeight: (icon ? icon.bitmap.height : 0),
            iconOffsetX: (icon ? icon.definition.offsetX : 0),
            iconOffsetY: (icon ? icon.definition.offsetY : 0),
            overlap: VariableFxConfiguredIcon.BAR_ICON_OVERLAP_PX
        });
    }
}

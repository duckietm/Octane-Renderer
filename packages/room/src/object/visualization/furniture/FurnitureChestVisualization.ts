import { RoomObjectVariable } from '@nitrots/api';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

/**
 * A wired chest.
 *
 * <p>Its asset carries a layer tagged `wired_emblem` — the little mark that says this chest is part
 * of the room's machinery rather than a box. Until the chest could actually be told apart, that mark
 * was drawn on every chest whether it meant anything or not. Now that a chest answers wired only once
 * its owner upgrades it, the emblem shows exactly when it is true.
 *
 * <p>Everything else is the ordinary animated furniture: the chest's states are its lid and, for a
 * coin chest, how much gold is in it.
 */
export class FurnitureChestVisualization extends FurnitureAnimatedVisualization
{
    private static readonly WIRED_EMBLEM_TAG: string = 'wired_emblem';

    /** The key the server puts in the chest's furni data. */
    private static readonly WIRED_ENABLED_KEY: string = 'is_wired_enabled';

    protected updateSprite(scale: number, layerId: number): void
    {
        super.updateSprite(scale, layerId);

        if(this.getLayerTag(scale, this.direction, layerId) !== FurnitureChestVisualization.WIRED_EMBLEM_TAG) return;

        const sprite = this.getSprite(layerId);

        if(!sprite) return;

        sprite.visible = this.answersWired();
    }

    /**
     * Whether this chest answers wired, from its own furni data.
     *
     * <p>A chest whose data says nothing is one served by a server that predates the upgrade, and back
     * then every chest answered wired — so silence means yes, the same way the parser reads it.
     */
    private answersWired(): boolean
    {
        const data = this.object?.model?.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);

        if(!data) return true;

        const value = data[FurnitureChestVisualization.WIRED_ENABLED_KEY];

        if(value === undefined || value === null) return true;

        return value !== '0';
    }
}

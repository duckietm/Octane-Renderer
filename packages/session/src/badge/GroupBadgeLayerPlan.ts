/** Where a badge part image stands: drawn into a texture, still on its way, or not loadable. */
export type GroupBadgePartImage<T> = { status: 'ready'; texture: T } | { status: 'pending' } | { status: 'failed' };

export interface PlannedGroupBadgeLayer<T>
{
    texture: T;
    x: number;
    y: number;
    tint: number | null;
}

export interface GroupBadgeLayerPlan<T, P>
{
    /** The layers in drawing order, or null while the badge has to wait (a part image downloading, the hotel's part list not in yet). */
    layers: PlannedGroupBadgeLayer<T>[] | null;
    /** Parts left out: unknown to the hotel's part list, or with no image that could be loaded. */
    skipped: P[];
}

export interface GroupBadgeLayerSources<T, P>
{
    /** The image names of a part, undefined when the part list has no such part. */
    names: (part: P) => string[] | undefined;
    image: (name: string) => GroupBadgePartImage<T>;
    /** True once the hotel's own part list arrived (not only last session's cached copy): an unknown part is then truly unknown. */
    partsKnown: boolean;
    position: (part: P, texture: T) => { x: number; y: number };
    tint: (part: P) => number | null;
}

/**
 * The layers of a group badge. A part the hotel does not have (a badge saved with a base or symbol that was removed from
 * `guilds_elements`) or whose image cannot be loaded is left out, so the rest of the badge is still drawn, as a badge
 * with an empty slot. The badge waits only while an image is still downloading or the hotel's part list has not arrived.
 */
export const planGroupBadgeLayers = <T, P>(parts: P[], sources: GroupBadgeLayerSources<T, P>): GroupBadgeLayerPlan<T, P> =>
{
    const layers: PlannedGroupBadgeLayer<T>[] = [];
    const skipped: P[] = [];
    // Every part is still looked at while waiting, so all missing images start downloading in the same pass.
    let waiting = false;

    for(const part of parts)
    {
        const names = sources.names(part)?.filter(name => !!name);

        if(!names?.length)
        {
            if(!sources.partsKnown) waiting = true;
            else skipped.push(part);

            continue;
        }

        let drawn = 0;
        let pending = false;

        for(const name of names)
        {
            const image = sources.image(name);

            if(image.status === 'pending')
            {
                pending = true;

                continue;
            }

            if(image.status === 'failed') continue;

            const { x, y } = sources.position(part, image.texture);

            layers.push({ texture: image.texture, x, y, tint: drawn ? null : sources.tint(part) });
            drawn++;
        }

        if(pending) waiting = true;
        else if(!drawn) skipped.push(part);
    }

    if(waiting) return { layers: null, skipped };

    return { layers: layers.length ? layers : null, skipped };
};

import type { FurnidataDeltaEntry } from '@nitrots/communication';

/**
 * Pure, testable furnidata-delta patcher. Mutates the FurnitureData objects in
 * the given maps (by id) and the localization keys, then dispatches the
 * `nitro-localization-updated` window event so subscribed React surfaces refresh.
 */
export function applyFurnidataDeltaTo(
    entries: FurnidataDeltaEntry[],
    floorItems: Map<number, any>,
    wallItems: Map<number, any>,
    localization: { setValue: (key: string, value: string) => void },
    win: { dispatchEvent: (event: any) => void }
): void
{
    if(!entries || !entries.length) return;

    for(const e of entries)
    {
        if(e.type === 'I')
        {
            const wall = wallItems.get(e.id);
            if(wall)
            {
                wall._localizedName = e.name; wall._description = e.description;
            }
            localization.setValue('wallItem.name.' + e.id, e.name);
            localization.setValue('wallItem.desc.' + e.id, e.description);
        }
        else
        {
            const floor = floorItems.get(e.id);
            if(floor)
            {
                floor._localizedName = e.name; floor._description = e.description;
            }
            localization.setValue('roomItem.name.' + e.id, e.name);
            localization.setValue('roomItem.desc.' + e.id, e.description);
        }
    }

    if(win && typeof win.dispatchEvent === 'function')
    {
        const evt = (typeof CustomEvent !== 'undefined')
            ? new CustomEvent('nitro-localization-updated')
            : { type: 'nitro-localization-updated' } as any;
        win.dispatchEvent(evt);
    }
}

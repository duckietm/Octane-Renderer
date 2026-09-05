import { OctaneEvent } from '../core';

export class PerksUpdatedEvent extends OctaneEvent
{
    public static PERKS_UPDATED: string = 'PUE_perks_updated';

    constructor()
    {
        super(PerksUpdatedEvent.PERKS_UPDATED);
    }
}

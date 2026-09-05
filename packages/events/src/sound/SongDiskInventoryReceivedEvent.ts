import { OctaneEvent } from '@octane/events';

export class SongDiskInventoryReceivedEvent extends OctaneEvent
{
    public static readonly SDIR_SONG_DISK_INVENTORY_RECEIVENT_EVENT = 'SDIR_SONG_DISK_INVENTORY_RECEIVENT_EVENT';

    constructor(type:string)
    {
        super(type);
    }
}

import { GetSessionDataManager } from '@octane/session';

/** True for player-facing wired storage chest floor furni (wf_storage_*). */
export const isWiredChestFloorItem = (typeId: number): boolean =>
{
    const data = GetSessionDataManager().getFloorItemData(typeId);

    if(!data?.className) return false;

    return data.className.startsWith('wf_storage_');
};

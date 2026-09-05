export interface IGroupInformationManager
{
    init(): void;
    getGroupBadge(groupId: number): string;

    /**
     * Returns the current `groupId -> badgeId` map as a frozen,
     * referentially stable ReadonlyMap. The same reference is returned
     * across reads until the underlying badges change; mutations
     * dispatch `OctaneEventType.GROUP_BADGES_UPDATED` to signal
     * invalidation.
     */
    getGroupBadgesSnapshot(): ReadonlyMap<number, string>;
}

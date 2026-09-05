export interface IIgnoredUsersManager
{
    init(): void;
    requestIgnoredUsers(username: string): void;
    ignoreUserId(id: number): void;
    ignoreUser(name: string): void;
    unignoreUser(name: string): void;
    isIgnored(name: string): boolean;

    /**
     * Returns the current ignored-users list as a frozen, referentially
     * stable array. The same reference is returned across reads until
     * the list is mutated; mutations dispatch
     * `OctaneEventType.IGNORED_USERS_UPDATED` to signal invalidation.
     *
     * Pairs with `useSyncExternalStore` on the React client.
     */
    getIgnoredUsersSnapshot(): ReadonlyArray<string>;
}

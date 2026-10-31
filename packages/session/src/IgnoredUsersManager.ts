import { IIgnoredUsersManager } from '@octane/api';
import { GetCommunication, GetIgnoredUsersComposer, IgnoreResultEvent, IgnoreUserComposer, IgnoredUsersEvent, UnignoreUserComposer } from '@octane/communication';
import { GetEventDispatcher, OctaneEvent, OctaneEventType } from '@octane/events';

/** The ignored users, keyed by user id as AIR's IgnoredUsersManager, so a name change does not lift an ignore. */
export class IgnoredUsersManager implements IIgnoredUsersManager
{
    private _ignoredUsers: number[] = [];
    private _ignoredUsersSnapshot: ReadonlyArray<number> | null = null;

    private invalidateIgnoredUsersSnapshot(): void
    {
        this._ignoredUsersSnapshot = null;

        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.IGNORED_USERS_UPDATED));
    }

    public getIgnoredUsersSnapshot(): ReadonlyArray<number>
    {
        if(this._ignoredUsersSnapshot) return this._ignoredUsersSnapshot;

        this._ignoredUsersSnapshot = Object.freeze<number[]>([ ...this._ignoredUsers ]);

        return this._ignoredUsersSnapshot;
    }

    public init(): void
    {
        GetCommunication().registerMessageEvent(new IgnoredUsersEvent(this.onIgnoredUsersEvent.bind(this)));
        GetCommunication().registerMessageEvent(new IgnoreResultEvent(this.onIgnoreResultEvent.bind(this)));
    }

    public requestIgnoredUsers(): void
    {
        GetCommunication().connection.send(new GetIgnoredUsersComposer());
    }

    private onIgnoredUsersEvent(event: IgnoredUsersEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        this._ignoredUsers = [ ...parser.ignoredUserIds ];
        this.invalidateIgnoredUsersSnapshot();
    }

    private onIgnoreResultEvent(event: IgnoreResultEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        const userId = parser.userId;

        switch(parser.result)
        {
            case 0:
                return;
            case 1:
                this.addUserToIgnoreList(userId);
                return;
            case 2:
                // The list was full: the server dropped its oldest entry to make room. Only when the user was
                // really added, or a user already on the list cost someone else their place.
                if(this.addUserToIgnoreList(userId))
                {
                    this._ignoredUsers.shift();
                    this.invalidateIgnoredUsersSnapshot();
                }
                return;
            case 3:
                this.removeUserFromIgnoreList(userId);
                return;
        }
    }

    /** Whether the user was added; false when already on the list. */
    private addUserToIgnoreList(userId: number): boolean
    {
        if(this._ignoredUsers.indexOf(userId) >= 0) return false;

        this._ignoredUsers.push(userId);
        this.invalidateIgnoredUsersSnapshot();

        return true;
    }

    private removeUserFromIgnoreList(userId: number): void
    {
        const index = this._ignoredUsers.indexOf(userId);

        if(index < 0) return;

        this._ignoredUsers.splice(index, 1);
        this.invalidateIgnoredUsersSnapshot();
    }

    public ignoreUser(userId: number): void
    {
        GetCommunication().connection.send(new IgnoreUserComposer(userId));
    }

    public unignoreUser(userId: number): void
    {
        GetCommunication().connection.send(new UnignoreUserComposer(userId));
    }

    public isIgnored(userId: number): boolean
    {
        return (this._ignoredUsers.indexOf(userId) >= 0);
    }
}

import { IIgnoredUsersManager } from '@octane/api';
import { GetCommunication, GetIgnoredUsersComposer, IgnoreResultEvent, IgnoreUserComposer, IgnoreUserIdComposer, IgnoredUsersEvent, UnignoreUserComposer } from '@octane/communication';
import { GetEventDispatcher, OctaneEvent, OctaneEventType } from '@octane/events';

export class IgnoredUsersManager implements IIgnoredUsersManager
{
    private _ignoredUsers: string[] = [];
    private _ignoredUsersSnapshot: ReadonlyArray<string> | null = null;

    private invalidateIgnoredUsersSnapshot(): void
    {
        this._ignoredUsersSnapshot = null;

        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.IGNORED_USERS_UPDATED));
    }

    public getIgnoredUsersSnapshot(): ReadonlyArray<string>
    {
        if(this._ignoredUsersSnapshot) return this._ignoredUsersSnapshot;

        this._ignoredUsersSnapshot = Object.freeze<string[]>([ ...this._ignoredUsers ]);

        return this._ignoredUsersSnapshot;
    }

    public init(): void
    {
        GetCommunication().registerMessageEvent(new IgnoredUsersEvent(this.onIgnoredUsersEvent.bind(this)));
        GetCommunication().registerMessageEvent(new IgnoreResultEvent(this.onIgnoreResultEvent.bind(this)));
    }

    public requestIgnoredUsers(username: string): void
    {
        GetCommunication().connection.send(new GetIgnoredUsersComposer(username));
    }

    private onIgnoredUsersEvent(event: IgnoredUsersEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        this._ignoredUsers = parser.ignoredUsers;
        this.invalidateIgnoredUsersSnapshot();
    }

    private onIgnoreResultEvent(event: IgnoreResultEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        const name = parser.name;

        switch(parser.result)
        {
            case 0:
                return;
            case 1:
                this.addUserToIgnoreList(name);
                return;
            case 2:
                this.addUserToIgnoreList(name);
                this._ignoredUsers.shift();
                this.invalidateIgnoredUsersSnapshot();
                return;
            case 3:
                this.removeUserFromIgnoreList(name);
                return;
        }
    }

    private addUserToIgnoreList(name: string): void
    {
        if(this._ignoredUsers.indexOf(name) >= 0) return;

        this._ignoredUsers.push(name);
        this.invalidateIgnoredUsersSnapshot();
    }

    private removeUserFromIgnoreList(name: string): void
    {
        const index = this._ignoredUsers.indexOf(name);

        if(index < 0) return;

        this._ignoredUsers.splice(index, 1);
        this.invalidateIgnoredUsersSnapshot();
    }

    public ignoreUserId(id: number): void
    {
        GetCommunication().connection.send(new IgnoreUserIdComposer(id));
    }

    public ignoreUser(name: string): void
    {
        GetCommunication().connection.send(new IgnoreUserComposer(name));
    }

    public unignoreUser(name: string): void
    {
        GetCommunication().connection.send(new UnignoreUserComposer(name));
    }

    public isIgnored(name: string): boolean
    {
        return (this._ignoredUsers.indexOf(name) >= 0);
    }
}

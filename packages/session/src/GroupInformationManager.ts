import { IGroupInformationManager } from '@nitrots/api';
import { GetCommunication, GetHabboGroupBadgesMessageComposer, HabboGroupBadgesMessageEvent, RoomReadyMessageEvent } from '@nitrots/communication';
import { GetEventDispatcher, NitroEvent, NitroEventType } from '@nitrots/events';

export class GroupInformationManager implements IGroupInformationManager
{
    private _groupBadges: Map<number, string> = new Map();
    private _groupBadgesSnapshot: ReadonlyMap<number, string> | null = null;

    public init(): void
    {
        GetCommunication().registerMessageEvent(new RoomReadyMessageEvent(this.onRoomReadyMessageEvent.bind(this)));
        GetCommunication().registerMessageEvent(new HabboGroupBadgesMessageEvent(this.onGroupBadgesEvent.bind(this)));
    }

    private onRoomReadyMessageEvent(event: RoomReadyMessageEvent): void
    {
        GetCommunication().connection.send(new GetHabboGroupBadgesMessageComposer());
    }

    private onGroupBadgesEvent(event: HabboGroupBadgesMessageEvent): void
    {
        const parser = event.getParser();

        let didChange = false;

        for(const [ groupId, badgeId ] of parser.badges.entries())
        {
            if(this._groupBadges.get(groupId) === badgeId) continue;

            this._groupBadges.set(groupId, badgeId);
            didChange = true;
        }

        if(didChange) this.invalidateGroupBadgesSnapshot();
    }

    private invalidateGroupBadgesSnapshot(): void
    {
        this._groupBadgesSnapshot = null;

        GetEventDispatcher().dispatchEvent(new NitroEvent(NitroEventType.GROUP_BADGES_UPDATED));
    }

    public getGroupBadge(groupId: number): string
    {
        return this._groupBadges.get(groupId) ?? '';
    }

    public getGroupBadgesSnapshot(): ReadonlyMap<number, string>
    {
        if(this._groupBadgesSnapshot) return this._groupBadgesSnapshot;

        this._groupBadgesSnapshot = new Map(this._groupBadges);

        return this._groupBadgesSnapshot;
    }
}

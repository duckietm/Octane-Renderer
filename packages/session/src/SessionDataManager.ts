import { IFurnitureData, IGroupInformationManager, IMessageComposer, IMessageEvent, IProductData, ISessionDataManager, IUserDataSnapshot, NoobnessLevelEnum, SecurityLevel } from '@nitrots/api';
import { AccountSafetyLockStatusChangeMessageEvent, AccountSafetyLockStatusChangeParser, AvailabilityStatusMessageEvent, ChangeUserNameResultMessageEvent, EmailStatusResultEvent, FigureUpdateEvent, FurnitureDataReloadEvent, GetCommunication, GetUserTagsComposer, InClientLinkEvent, MysteryBoxKeysEvent, NoobnessLevelMessageEvent, PetRespectComposer, PetScratchFailedMessageEvent, RoomReadyMessageEvent, RoomUnitChatComposer, UserInfoEvent, UserNameChangeMessageEvent, UserPermissionsEvent, UserRespectComposer, UserTagsMessageEvent } from '@nitrots/communication';
import type { FurnidataDeltaEntry } from '@nitrots/communication';
import { applyFurnidataDeltaTo } from './furniture/applyFurnidataDelta';
import { GetConfiguration } from '@nitrots/configuration';
import { GetLocalizationManager } from '@nitrots/localization';
import { GetEventDispatcher, MysteryBoxKeysUpdateEvent, NitroEvent, NitroEventType, NitroSettingsEvent, SessionDataPreferencesEvent, UserNameUpdateEvent } from '@nitrots/events';
import { CreateLinkEvent, HabboWebTools, parseConfigJsonFromResponse } from '@nitrots/utils';
import { Texture } from 'pixi.js';
import { GroupInformationManager } from './GroupInformationManager';
import { IgnoredUsersManager } from './IgnoredUsersManager';
import { BadgeImageManager } from './badge/BadgeImageManager';
import { FurnitureDataLoader } from './furniture/FurnitureDataLoader';
import { ProductDataLoader } from './product/ProductDataLoader';

export class SessionDataManager implements ISessionDataManager
{
    private _messageEvents: IMessageEvent[] = [];
    private _settingsEventCallback: (event: NitroSettingsEvent) => void = null;
    private _userId: number;
    private _name: string;
    private _figure: string;
    private _gender: string;
    private _realName: string;
    private _respectsReceived: number;
    private _respectsLeft: number;
    private _respectsPetLeft: number;
    private _canChangeName: boolean;
    private _safetyLocked: boolean;

    private _ignoredUsersManager: IgnoredUsersManager = new IgnoredUsersManager();
    private _groupInformationManager: IGroupInformationManager = new GroupInformationManager();

    private _clubLevel: number = 0;
    private _securityLevel: number = 0;
    private _isAmbassador: boolean = false;
    private _rankId: number = 0;
    private _rankName: string = '';
    private _rankBadge: string = '';
    private _rankPrefix: string = '';
    private _rankPrefixColor: string = '';
    private _noobnessLevel: number = -1;
    private _isEmailVerified: boolean = false;

    private _systemOpen: boolean = false;
    private _systemShutdown: boolean = false;
    private _isAuthenticHabbo: boolean = false;
    private _isRoomCameraFollowDisabled: boolean = false;
    private _uiFlags: number = 0;

    private _floorItems: Map<number, IFurnitureData> = new Map();
    private _wallItems: Map<number, IFurnitureData> = new Map();
    private _floorItemOverrides: Map<string, Partial<IFurnitureData>> = new Map();
    private _wallItemOverrides: Map<string, Partial<IFurnitureData>> = new Map();
    private _products: Map<string, IProductData> = new Map();
    private _furnitureData: FurnitureDataLoader = new FurnitureDataLoader(this._floorItems, this._wallItems);
    private _productData: ProductDataLoader = new ProductDataLoader(this._products);
    private _tags: string[] = [];

    private _badgeImageManager: BadgeImageManager = new BadgeImageManager();

    private _userDataSnapshot: Readonly<IUserDataSnapshot> | null = null;

    private _permissions: Map<string, number> = new Map();
    private _permissionsSnapshot: ReadonlyMap<string, number> | null = null;

    constructor()
    {
        this.resetUserInfo();
    }

    private invalidateUserDataSnapshot(): void
    {
        this._userDataSnapshot = null;

        GetEventDispatcher().dispatchEvent(new NitroEvent(NitroEventType.SESSION_DATA_UPDATED));
    }

    private invalidatePermissionsSnapshot(): void
    {
        this._permissionsSnapshot = null;

        GetEventDispatcher().dispatchEvent(new NitroEvent(NitroEventType.USER_PERMISSIONS_UPDATED));
    }

    /**
     * Resolved permission map for the current user — mirror of
     * `permission_definitions` for the user's rank, filtered to keys
     * with `PermissionSetting != DISALLOWED`. Wire-fed by
     * `UserPermissionsMapEvent` (Arcturus ≥ 4.2.10). Older emulators
     * that don't ship the new packet leave the snapshot empty; React
     * consumers via `useHasPermission(key)` then degrade gracefully
     * (every gate returns false → mod UI hidden, which is the safe
     * default).
     *
     * Referentially stable until the next
     * `UserPermissionsMapEvent` arrives (e.g. after
     * `HabboManager.setRank`).
     */
    public getPermissionsSnapshot(): ReadonlyMap<string, number>
    {
        if(this._permissionsSnapshot) return this._permissionsSnapshot;

        this._permissionsSnapshot = new Map(this._permissions);

        return this._permissionsSnapshot;
    }

    public getUserDataSnapshot(): Readonly<IUserDataSnapshot>
    {
        if(this._userDataSnapshot) return this._userDataSnapshot;

        this._userDataSnapshot = Object.freeze<IUserDataSnapshot>({
            userId: this._userId,
            userName: this._name,
            figure: this._figure,
            gender: this._gender,
            realName: this._realName,
            respectsReceived: this._respectsReceived,
            respectsLeft: this._respectsLeft,
            respectsPetLeft: this._respectsPetLeft,
            canChangeName: this._canChangeName,
            clubLevel: this._clubLevel,
            securityLevel: this._securityLevel,
            isAmbassador: this._isAmbassador,
            isEmailVerified: this._isEmailVerified,
            isNoob: (this._noobnessLevel !== NoobnessLevelEnum.OLD_IDENTITY),
            isAuthenticHabbo: this._isAuthenticHabbo,
            isSystemOpen: this._systemOpen,
            isSystemShutdown: this._systemShutdown,
            uiFlags: this._uiFlags,
            tags: Object.freeze<string[]>([...this._tags]),
            rankId: this._rankId,
            rankName: this._rankName,
            rankBadge: this._rankBadge,
            rankPrefix: this._rankPrefix,
            rankPrefixColor: this._rankPrefixColor
        });

        return this._userDataSnapshot;
    }

    public async init(): Promise<void>
    {
        await Promise.all([
            this._furnitureData.init(),
            this._productData.init(),
            this._badgeImageManager.init(),
            Promise.resolve(this._ignoredUsersManager.init()),
            Promise.resolve(this._groupInformationManager.init())
        ]);

        // Store message event references for cleanup
        this._messageEvents.push(
            GetCommunication().registerMessageEvent(new FigureUpdateEvent((event: FigureUpdateEvent) =>
            {
                this._figure = event.getParser().figure;
                this._gender = event.getParser().gender;

                HabboWebTools.updateFigure(this._figure);

                this.invalidateUserDataSnapshot();
            })),
            GetCommunication().registerMessageEvent(new UserInfoEvent(this.onUserInfoEvent.bind(this))),
            GetCommunication().registerMessageEvent(new UserPermissionsEvent(this.onUserPermissionsEvent.bind(this))),
            GetCommunication().registerMessageEvent(new AvailabilityStatusMessageEvent(this.onAvailabilityStatusMessageEvent.bind(this))),
            GetCommunication().registerMessageEvent(new PetScratchFailedMessageEvent(this.onPetRespectFailed.bind(this))),
            GetCommunication().registerMessageEvent(new ChangeUserNameResultMessageEvent(this.onChangeNameUpdateEvent.bind(this))),
            GetCommunication().registerMessageEvent(new UserNameChangeMessageEvent(this.onUserNameChangeMessageEvent.bind(this))),
            GetCommunication().registerMessageEvent(new UserTagsMessageEvent(this.onUserTags.bind(this))),
            GetCommunication().registerMessageEvent(new RoomReadyMessageEvent(this.onRoomModelNameEvent.bind(this))),
            GetCommunication().registerMessageEvent(new InClientLinkEvent(this.onInClientLinkEvent.bind(this))),
            GetCommunication().registerMessageEvent(new MysteryBoxKeysEvent(this.onMysteryBoxKeysEvent.bind(this))),
            GetCommunication().registerMessageEvent(new NoobnessLevelMessageEvent(this.onNoobnessLevelMessageEvent.bind(this))),
            GetCommunication().registerMessageEvent(new AccountSafetyLockStatusChangeMessageEvent(this.onAccountSafetyLockStatusChangeMessageEvent.bind(this))),
            GetCommunication().registerMessageEvent(new EmailStatusResultEvent(this.onEmailStatus.bind(this))),
            GetCommunication().registerMessageEvent(new FurnitureDataReloadEvent((event: FurnitureDataReloadEvent) =>
            {
                const parser = event.getParser();
                if(parser.mode === 1)
                {
                    void this.applyFurnidataReloadHint();
                }
                else
                {
                    this.applyFurnidataDelta(parser.entries);
                }
            }))
        );

        // Store event dispatcher callback for cleanup
        this._settingsEventCallback = (event: NitroSettingsEvent) =>
        {
            this._isRoomCameraFollowDisabled = event.cameraFollow;
            this._uiFlags = event.flags;

            GetEventDispatcher().dispatchEvent(new SessionDataPreferencesEvent(this._uiFlags));

            this.invalidateUserDataSnapshot();
        };

        GetEventDispatcher().addEventListener<NitroSettingsEvent>(NitroSettingsEvent.SETTINGS_UPDATED, this._settingsEventCallback);
    }

    public dispose(): void
    {
        if(this._respectTimer)
        {
            clearTimeout(this._respectTimer);

            this._respectTimer = null;
        }

        this._pendingRespects = [];

        // Remove all message events
        for(const event of this._messageEvents)
        {
            GetCommunication().removeMessageEvent(event);
        }
        this._messageEvents = [];

        // Remove event dispatcher listener
        if(this._settingsEventCallback)
        {
            GetEventDispatcher().removeEventListener(NitroSettingsEvent.SETTINGS_UPDATED, this._settingsEventCallback);
            this._settingsEventCallback = null;
        }
    }

    private resetUserInfo(): void
    {
        this._userId = 0;
        this._name = null;
        this._figure = null;
        this._gender = null;
        this._realName = null;
        this._canChangeName = false;
        this._safetyLocked = false;
    }

    public getAllFurnitureData(): IFurnitureData[]
    {
        return [
            ...Array.from(this._floorItems.values()).map(item => this.applyFurnitureOverrides(item, this._floorItemOverrides)),
            ...Array.from(this._wallItems.values()).map(item => this.applyFurnitureOverrides(item, this._wallItemOverrides))
        ];
    }

    // Merge a runtime furniture-data chunk such as custom/imported.jsonc into
    // the existing maps without reloading the client. The returned entries let
    // the caller update RoomContentLoader and expose imported furniture live.
    public async mergeFurnitureDataFromUrl(url: string): Promise<IFurnitureData[]>
    {
        if(!url || !url.length) return [];

        const added = await this._furnitureData.mergeFromUrl(url);

        // Refresh the furni name/desc surfaces (catalog, inventory, infostand)
        // via the window event they actually listen to — same signal
        // applyFurnidataDelta uses. SESSION_DATA_UPDATED only drives the userData
        // snapshot and, dispatched here without invalidateUserDataSnapshot(), was
        // a no-op (the snapshot ref never changed, so consumers bailed out).
        if(added && added.length && (typeof window !== 'undefined')) window.dispatchEvent(new CustomEvent('nitro-localization-updated'));

        return added;
    }

    public async applyFurnitureDataOverrides(url: string): Promise<void>
    {
        if(!url || !url.length)
        {
            this.clearFurnitureDataOverrides();

            return;
        }

        const response = await fetch(url);

        if(response.status !== 200) throw new Error(`Unable to load ${ url }`);

        const data = await parseConfigJsonFromResponse(response, url);

        this._floorItemOverrides = this.parseFurnitureOverrides(data?.roomitemtypes?.furnitype || []);
        this._wallItemOverrides = this.parseFurnitureOverrides(data?.wallitemtypes?.furnitype || []);

        this.refreshFurnitureLocalizations();
    }

    public clearFurnitureDataOverrides(): void
    {
        this._floorItemOverrides.clear();
        this._wallItemOverrides.clear();
        this.refreshFurnitureLocalizations();
    }

    private onUserInfoEvent(event: UserInfoEvent): void
    {
        if(!event || !event.connection) return;

        this.resetUserInfo();

        const userInfo = event.getParser().userInfo;

        if(!userInfo) return;

        this._userId = userInfo.userId;
        this._name = userInfo.username;
        this._figure = userInfo.figure;
        this._gender = userInfo.gender;
        this._realName = userInfo.realName;
        this._respectsReceived = userInfo.respectsReceived;
        this._respectsLeft = userInfo.respectsRemaining;
        this._respectsPetLeft = userInfo.respectsPetRemaining;
        this._canChangeName = userInfo.canChangeName;
        this._safetyLocked = userInfo.safetyLocked;

        this._ignoredUsersManager.requestIgnoredUsers(userInfo.username);

        this.invalidateUserDataSnapshot();
    }

    private onUserPermissionsEvent(event: UserPermissionsEvent): void
    {
        if(!event || !event.connection) return;

        const parser = event.getParser();

        this._clubLevel = parser.clubLevel;
        this._securityLevel = parser.securityLevel;
        this._isAmbassador = parser.isAmbassador;
        this._rankId = parser.rankId;
        this._rankName = parser.rankName;
        this._rankBadge = parser.rankBadge;
        this._rankPrefix = parser.rankPrefix;
        this._rankPrefixColor = parser.rankPrefixColor;
        // Copy into our local mutable Map so the parser's reference
        // (which is overwritten on every parse() call) can't leak back
        // to consumers.
        this._permissions = new Map(parser.permissions);

        // Invalidate BOTH snapshots: a UserPermissionsComposer push from
        // the emulator refreshes user-data fields (clubLevel/securityLevel
        // /rank metadata) AND the resolved permission map. Keep the two
        // invalidation events distinct so React consumers can subscribe
        // to just one (e.g. a widget that only cares about
        // useHasPermission re-renders only when the map actually
        // changes, not on every snapshot bump).
        this.invalidateUserDataSnapshot();
        this.invalidatePermissionsSnapshot();
    }

    private onAvailabilityStatusMessageEvent(event: AvailabilityStatusMessageEvent): void
    {
        if(!event || !event.connection) return;

        const parser = event.getParser();

        if(!parser) return;

        this._systemOpen = parser.isOpen;
        this._systemShutdown = parser.onShutdown;
        this._isAuthenticHabbo = parser.isAuthenticUser;

        this.invalidateUserDataSnapshot();
    }

    private onPetRespectFailed(event: PetScratchFailedMessageEvent): void
    {
        if(!event || !event.connection) return;

        this._respectsPetLeft++;

        this.invalidateUserDataSnapshot();
    }

    private onChangeNameUpdateEvent(event: ChangeUserNameResultMessageEvent): void
    {
        if(!event || !event.connection) return;

        const parser = event.getParser();

        if(!parser) return;

        if(parser.resultCode !== ChangeUserNameResultMessageEvent.NAME_OK) return;

        this._canChangeName = false;

        GetEventDispatcher().dispatchEvent(new UserNameUpdateEvent(parser.name));

        this.invalidateUserDataSnapshot();
    }

    private onUserNameChangeMessageEvent(event: UserNameChangeMessageEvent): void
    {
        if(!event || !event.connection) return;

        const parser = event.getParser();

        if(!parser) return;

        if(parser.webId !== this.userId) return;

        this._name = parser.newName;
        this._canChangeName = false;

        GetEventDispatcher().dispatchEvent(new UserNameUpdateEvent(this._name));

        this.invalidateUserDataSnapshot();
    }

    private onUserTags(event: UserTagsMessageEvent): void
    {
        if(!event || !event.connection) return;

        const parser = event.getParser();

        if(!parser) return;

        this._tags = parser.tags;

        this.invalidateUserDataSnapshot();
    }

    private onRoomModelNameEvent(event: RoomReadyMessageEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        HabboWebTools.roomVisited(parser.roomId);
    }

    private onInClientLinkEvent(event: InClientLinkEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        CreateLinkEvent(parser.link);
    }

    private onMysteryBoxKeysEvent(event: MysteryBoxKeysEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        GetEventDispatcher().dispatchEvent(new MysteryBoxKeysUpdateEvent(parser.boxColor, parser.keyColor));
    }

    private onNoobnessLevelMessageEvent(event: NoobnessLevelMessageEvent): void
    {
        this._noobnessLevel = event.getParser().noobnessLevel;

        if(this._noobnessLevel !== NoobnessLevelEnum.OLD_IDENTITY) GetConfiguration().setValue<number>('new.identity', 1);

        this.invalidateUserDataSnapshot();
    }

    private onAccountSafetyLockStatusChangeMessageEvent(event: AccountSafetyLockStatusChangeMessageEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        this._safetyLocked = (parser.status === AccountSafetyLockStatusChangeParser.SAFETY_LOCK_STATUS_LOCKED);
    }

    private onEmailStatus(event: EmailStatusResultEvent): void
    {
        this._isEmailVerified = event?.getParser()?.isVerified ?? false;

        this.invalidateUserDataSnapshot();
    }

    public getFloorItemData(id: number): IFurnitureData
    {
        const existing = this._floorItems.get(id);

        if(!existing) return null;

        return this.applyFurnitureOverrides(existing, this._floorItemOverrides);
    }

    public getFloorItemDataByName(name: string): IFurnitureData
    {
        if(!name || !this._floorItems || !this._floorItems.size) return null;

        for(const item of this._floorItems.values())
        {
            if(!item || (item.className !== name)) continue;

            return this.applyFurnitureOverrides(item, this._floorItemOverrides);
        }

        return null;
    }

    public getWallItemData(id: number): IFurnitureData
    {
        const existing = this._wallItems.get(id);

        if(!existing) return null;

        return this.applyFurnitureOverrides(existing, this._wallItemOverrides);
    }

    public getWallItemDataByName(name: string): IFurnitureData
    {
        if(!name || !this._wallItems || !this._wallItems.size) return null;

        for(const item of this._wallItems.values())
        {
            if(!item || (item.className !== name)) continue;

            return this.applyFurnitureOverrides(item, this._wallItemOverrides);
        }

        return null;
    }

    public getProductData(type: string): IProductData
    {
        return this._products.get(type);
    }

    private parseFurnitureOverrides(items: any[]): Map<string, Partial<IFurnitureData>>
    {
        const overrides = new Map<string, Partial<IFurnitureData>>();

        for(const item of items)
        {
            if(!item?.classname) continue;

            const className = ((item.classname as string).split('*')[0] || '').trim();

            if(!className.length) continue;

            overrides.set(className, {
                name: item.name || '',
                description: item.description || ''
            });
        }

        return overrides;
    }

    private applyFurnitureOverrides(item: IFurnitureData, overrides: Map<string, Partial<IFurnitureData>>): IFurnitureData
    {
        if(!item) return null;

        const override = overrides.get(item.className);

        if(!override) return item;

        const clonedItem = Object.assign(Object.create(Object.getPrototypeOf(item)), item);

        if(override.name !== undefined) clonedItem._localizedName = override.name;
        if(override.description !== undefined) clonedItem._description = override.description;

        return clonedItem as IFurnitureData;
    }

    private refreshFurnitureLocalizations(): void
    {
        const localizationManager = GetLocalizationManager();

        for(const item of this._floorItems.values())
        {
            const resolvedItem = this.applyFurnitureOverrides(item, this._floorItemOverrides);

            localizationManager.setValue(('roomItem.name.' + item.id), resolvedItem.name);
            localizationManager.setValue(('roomItem.desc.' + item.id), resolvedItem.description);
        }

        for(const item of this._wallItems.values())
        {
            const resolvedItem = this.applyFurnitureOverrides(item, this._wallItemOverrides);

            localizationManager.setValue(('wallItem.name.' + item.id), resolvedItem.name);
            localizationManager.setValue(('wallItem.desc.' + item.id), resolvedItem.description);
        }
    }

    public applyFurnidataDelta(entries: FurnidataDeltaEntry[]): void
    {
        applyFurnidataDeltaTo(entries, this._floorItems as any, this._wallItems as any, GetLocalizationManager(), (typeof window !== 'undefined') ? window : { dispatchEvent: () =>
        {} });
    }

    public async applyFurnidataReloadHint(): Promise<void>
    {
        await this._furnitureData.init();
        if(typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('nitro-localization-updated'));
    }

    public getBadgeUrl(name: string): string
    {
        return this._badgeImageManager.getBadgeUrl(name);
    }

    public getGroupBadgeUrl(name: string): string
    {
        return this._badgeImageManager.getBadgeUrl(name, BadgeImageManager.GROUP_BADGE);
    }

    public getBadgeImage(name: string): Texture
    {
        return this._badgeImageManager.getBadgeImage(name);
    }

    public getGroupBadgeImage(name: string): Texture
    {
        return this._badgeImageManager.getBadgeImage(name, BadgeImageManager.GROUP_BADGE);
    }

    public getUserTags(roomUnitId: number): string[]
    {
        if(roomUnitId < 0) return;

        this.send(new GetUserTagsComposer(roomUnitId));
    }

    public loadBadgeImage(name: string): string
    {
        return this._badgeImageManager.loadBadgeImage(name);
    }

    public loadGroupBadgeImage(name: string): string
    {
        return this._badgeImageManager.loadBadgeImage(name, BadgeImageManager.GROUP_BADGE);
    }

    public hasSecurity(level: number): boolean
    {
        return (this._securityLevel >= level);
    }

    /** Matches the ratelimit on the server's RoomUserGiveRespectEvent. */
    private static readonly RESPECT_MIN_INTERVAL: number = 250;

    private _pendingRespects: number[] = [];
    private _nextRespectAt: number = 0;
    private _respectTimer: ReturnType<typeof setTimeout> = null;

    /**
     * The server drops a respect that arrives within its handler ratelimit and
     * never runs the handler, so nothing is spent on its side. Decrementing
     * locally on every click therefore made the counter drift: click three
     * times quickly and the client showed three spent while only two were
     * delivered.
     *
     * Reserve the point immediately — the UI must not offer more than we have —
     * but pace the sends so every one of them is actually accepted.
     */
    public giveRespect(userId: number): void
    {
        if((userId < 0) || (this._respectsLeft <= 0)) return;

        this._respectsLeft--;

        this.invalidateUserDataSnapshot();

        this._pendingRespects.push(userId);

        this.flushPendingRespects();
    }

    private flushPendingRespects(): void
    {
        if(this._respectTimer || !this._pendingRespects.length) return;

        const wait = this._nextRespectAt - Date.now();

        if(wait > 0)
        {
            this._respectTimer = setTimeout(() =>
            {
                this._respectTimer = null;

                this.flushPendingRespects();
            }, wait);

            return;
        }

        const userId = this._pendingRespects.shift();

        this.send(new UserRespectComposer(userId));

        this._nextRespectAt = Date.now() + SessionDataManager.RESPECT_MIN_INTERVAL;

        this.flushPendingRespects();
    }

    public givePetRespect(petId: number): void
    {
        if((petId < 0) || (this._respectsPetLeft <= 0)) return;

        this.send(new PetRespectComposer(petId));

        this._respectsPetLeft--;

        this.invalidateUserDataSnapshot();
    }

    public sendSpecialCommandMessage(text: string, styleId: number = 0): void
    {
        this.send(new RoomUnitChatComposer(text));
    }

    public ignoreUser(name: string): void
    {
        this._ignoredUsersManager.ignoreUser(name);
    }

    public unignoreUser(name: string): void
    {
        this._ignoredUsersManager.unignoreUser(name);
    }

    public isUserIgnored(name: string): boolean
    {
        return this._ignoredUsersManager.isIgnored(name);
    }

    public getGroupBadge(groupId: number): string
    {
        return this._groupInformationManager.getGroupBadge(groupId);
    }

    public send(composer: IMessageComposer<unknown[]>): void
    {
        GetCommunication().connection.send(composer);
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get userName(): string
    {
        return this._name;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get realName(): string
    {
        return this._realName;
    }

    public get ignoredUsersManager(): IgnoredUsersManager
    {
        return this._ignoredUsersManager;
    }

    public get groupInformationManager(): IGroupInformationManager
    {
        return this._groupInformationManager;
    }

    public get respectsReceived(): number
    {
        return this._respectsReceived;
    }

    public get respectsLeft(): number
    {
        return this._respectsLeft;
    }

    public get respectsPetLeft(): number
    {
        return this._respectsPetLeft;
    }

    public get canChangeName(): boolean
    {
        return this._canChangeName;
    }

    public get clubLevel(): number
    {
        return this._clubLevel;
    }

    public get securityLevel(): number
    {
        return this._securityLevel;
    }

    public get isAmbassador(): boolean
    {
        return this._isAmbassador;
    }

    public get isEmailVerified(): boolean
    {
        return this._isEmailVerified;
    }

    public get isSafetyLocked(): boolean
    {
        return this._safetyLocked;
    }

    public get isNoob(): boolean
    {
        return (this._noobnessLevel !== NoobnessLevelEnum.OLD_IDENTITY);
    }

    public get isRealNoob(): boolean
    {
        return (this._noobnessLevel === NoobnessLevelEnum.REAL_NOOB);
    }

    public get isSystemOpen(): boolean
    {
        return this._systemOpen;
    }

    public get isSystemShutdown(): boolean
    {
        return this._systemShutdown;
    }

    public get isAuthenticHabbo(): boolean
    {
        return this._isAuthenticHabbo;
    }

    public get isModerator(): boolean
    {
        return (this._securityLevel >= SecurityLevel.MODERATOR);
    }

    public get isCameraFollowDisabled(): boolean
    {
        return this._isRoomCameraFollowDisabled;
    }

    public get uiFlags(): number
    {
        return this._uiFlags;
    }

    public get tags(): string[]
    {
        return this._tags;
    }
}

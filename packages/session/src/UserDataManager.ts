import { IRoomUserData, IUserDataManager } from '@nitrots/api';
import { GetCommunication, RequestPetInfoComposer, UserCurrentBadgesComposer } from '@nitrots/communication';
import { GetEventDispatcher, NitroEvent, NitroEventType } from '@nitrots/events';

export class UserDataManager implements IUserDataManager
{
    private static TYPE_USER: number = 1;
    private static TYPE_PET: number = 2;
    private static TYPE_BOT: number = 3;
    private static TYPE_RENTABLE_BOT: number = 4;

    private _userDataByType: Map<number, Map<number, IRoomUserData>> = new Map();
    private _userDataByRoomIndex: Map<number, IRoomUserData> = new Map();
    private _userBadges: Map<number, string[]> = new Map();
    private _roomUserListSnapshot: ReadonlyArray<IRoomUserData> | null = null;

    private invalidateRoomUserListSnapshot(): void
    {
        this._roomUserListSnapshot = null;

        GetEventDispatcher().dispatchEvent(new NitroEvent(NitroEventType.ROOM_USER_LIST_UPDATED));
    }

    public getRoomUserListSnapshot(): ReadonlyArray<IRoomUserData>
    {
        if(this._roomUserListSnapshot) return this._roomUserListSnapshot;

        this._roomUserListSnapshot = Object.freeze<IRoomUserData[]>([ ...this._userDataByRoomIndex.values() ]);

        return this._roomUserListSnapshot;
    }

    public getUserData(webID: number): IRoomUserData
    {
        return this.getDataByType(webID, UserDataManager.TYPE_USER);
    }

    public getPetData(webID: number): IRoomUserData
    {
        return this.getDataByType(webID, UserDataManager.TYPE_PET);
    }

    public getBotData(webID: number): IRoomUserData
    {
        return this.getDataByType(webID, UserDataManager.TYPE_BOT);
    }

    public getRentableBotData(webID: number): IRoomUserData
    {
        return this.getDataByType(webID, UserDataManager.TYPE_RENTABLE_BOT);
    }

    public getDataByType(webID: number, type: number): IRoomUserData
    {
        const existing = this._userDataByType.get(type);

        if(!existing) return null;

        const userData = existing.get(webID);

        if(!userData) return null;

        return userData;
    }

    public getUserDataByIndex(roomIndex: number): IRoomUserData
    {
        const existing = this._userDataByRoomIndex.get(roomIndex);

        if(!existing) return null;

        return existing;
    }

    public getUserDataByName(name: string): IRoomUserData
    {
        for(const userData of this._userDataByRoomIndex.values())
        {
            if(!userData || (userData.name !== name)) continue;

            return userData;
        }

        return null;
    }

    public updateUserData(data: IRoomUserData): void
    {
        if(!data) return;

        this.removeUserData(data.roomIndex);

        let existingType = this._userDataByType.get(data.type);

        if(!existingType)
        {
            existingType = new Map();

            this._userDataByType.set(data.type, existingType);
        }

        const previous = existingType.get(data.webID);

        if(previous && (previous.roomIndex !== data.roomIndex)) this._userDataByRoomIndex.delete(previous.roomIndex);

        existingType.set(data.webID, data);

        this._userDataByRoomIndex.set(data.roomIndex, data);

        this.invalidateRoomUserListSnapshot();
    }

    public removeUserData(roomIndex: number): void
    {
        const existing = this.getUserDataByIndex(roomIndex);

        if(!existing) return;

        this._userDataByRoomIndex.delete(roomIndex);

        const existingType = this._userDataByType.get(existing.type);

        if(existingType) existingType.delete(existing.webID);

        this.invalidateRoomUserListSnapshot();
    }

    public getUserBadges(userId: number): string[]
    {
        GetCommunication().connection.send(new UserCurrentBadgesComposer(userId));

        const badges = this._userBadges.get(userId);

        if(!badges) return [];

        return badges;
    }

    public setUserBadges(userId: number, badges: string[]): void
    {
        this._userBadges.set(userId, badges);
    }

    public updateFigure(roomIndex: number, figure: string, sex: string, hasSaddle: boolean, isRiding: boolean): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.figure = figure;
        userData.sex = sex;
        userData.hasSaddle = hasSaddle;
        userData.isRiding = isRiding;

        this.invalidateRoomUserListSnapshot();
    }

    public updateName(roomIndex: number, name: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.name = name;

        this.invalidateRoomUserListSnapshot();
    }

    public updateMotto(roomIndex: number, custom: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.custom = custom;

        this.invalidateRoomUserListSnapshot();
    }

    public updateNickIcon(roomIndex: number, nickIcon: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.nickIcon = nickIcon;

        this.invalidateRoomUserListSnapshot();
    }

    public updateCustomization(roomIndex: number, nickIcon: string, prefixText: string, prefixColor: string, prefixIcon: string, prefixEffect: string, prefixFont: string, displayOrder: string): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.nickIcon = nickIcon;
        userData.prefixText = prefixText;
        userData.prefixColor = prefixColor;
        userData.prefixIcon = prefixIcon;
        userData.prefixEffect = prefixEffect;
        userData.prefixFont = prefixFont;
        userData.displayOrder = displayOrder;

        this.invalidateRoomUserListSnapshot();
    }

    public updateBackground(roomIndex: number, background: number, stand: number, overlay: number, cardBackground: number = 0, borderId: number = 0): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.background = background;
        userData.stand = stand;
        userData.overlay = overlay;
        userData.cardBackground = cardBackground;
        userData.borderId = borderId;

        this.invalidateRoomUserListSnapshot();
    }

    public updateAchievementScore(roomIndex: number, score: number): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.activityPoints = score;

        this.invalidateRoomUserListSnapshot();
    }

    public updatePetLevel(roomIndex: number, level: number): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.petLevel = level;

        this.invalidateRoomUserListSnapshot();
    }

    public updatePetBreedingStatus(roomIndex: number, canBreed: boolean, canHarvest: boolean, canRevive: boolean, hasBreedingPermission: boolean): void
    {
        const userData = this.getUserDataByIndex(roomIndex);

        if(!userData) return;

        userData.canBreed = canBreed;
        userData.canHarvest = canHarvest;
        userData.canRevive = canRevive;
        userData.hasBreedingPermission = hasBreedingPermission;

        this.invalidateRoomUserListSnapshot();
    }

    public requestPetInfo(id: number): void
    {
        const petData = this.getPetData(id);

        if(!petData) return;

        GetCommunication().connection.send(new RequestPetInfoComposer(id));
    }
}

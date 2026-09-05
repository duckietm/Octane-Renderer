import { IRoomUserData } from './IRoomUserData';

export interface IUserDataManager
{
    getUserData(webID: number): IRoomUserData;
    getPetData(webID: number): IRoomUserData;
    getBotData(webID: number): IRoomUserData;
    getRentableBotData(webID: number): IRoomUserData;
    getDataByType(webID: number, type: number): IRoomUserData;
    getUserDataByIndex(roomIndex: number): IRoomUserData;
    getUserDataByName(name: string): IRoomUserData;
    updateUserData(data: IRoomUserData): void;
    removeUserData(roomIndex: number): void;
    getUserBadges(userId: number): string[];
    setUserBadges(userId: number, badges: string[]): void;
    updateFigure(roomIndex: number, figure: string, sex: string, hasSaddle: boolean, isRiding: boolean): void;
    updateName(roomIndex: number, name: string): void;
    updateMotto(roomIndex: number, custom: string): void;
    updateNickIcon(roomIndex: number, nickIcon: string): void;
    updateCustomization(roomIndex: number, nickIcon: string, prefixText: string, prefixColor: string, prefixIcon: string, prefixEffect: string, prefixFont: string, displayOrder: string): void;
    updateBackground(roomIndex: number, background: number, stand: number, overlay: number, cardBackground?: number, borderId?: number): void;
    updateAchievementScore(roomIndex: number, score: number): void;
    updatePetLevel(roomIndex: number, level: number): void;
    updatePetBreedingStatus(roomIndex: number, canBreed: boolean, canHarvest: boolean, canRevive: boolean, hasBreedingPermission: boolean): void;
    requestPetInfo(id: number): void;

    /**
     * Returns the current room's user list as a referentially-stable
     * ReadonlyArray. The same array reference is returned across reads
     * until any user is added, removed, or has a tracked field updated
     * (figure / name / motto / nick icon / customization / background /
     * achievement score / pet level / breeding status). Mutations
     * dispatch `OctaneEventType.ROOM_USER_LIST_UPDATED` to signal
     * invalidation.
     *
     * The inner IRoomUserData objects keep the existing in-place
     * mutation semantics — they are NOT deep-cloned. Treat them as
     * snapshots-at-time-of-read; consumers should not retain individual
     * entries across invalidations.
     */
    getRoomUserListSnapshot(): ReadonlyArray<IRoomUserData>;
}

import { Texture } from 'pixi.js';
import { IFurnitureData } from './IFurnitureData';
import { IGroupInformationManager } from './IGroupInformationManager';
import { IIgnoredUsersManager } from './IIgnoredUsersManager';
import { IProductData } from './IProductData';
import { IUserDataSnapshot } from './IUserDataSnapshot';

export interface ISessionDataManager
{
    init(): Promise<void>;
    getAllFurnitureData(): IFurnitureData[];
    mergeFurnitureDataFromUrl(url: string): Promise<IFurnitureData[]>;
    applyFurnitureDataOverrides(url: string): Promise<void>;
    clearFurnitureDataOverrides(): void;
    getFloorItemData(id: number): IFurnitureData;
    getFloorItemDataByName(name: string): IFurnitureData;
    getWallItemData(id: number): IFurnitureData;
    getWallItemDataByName(name: string): IFurnitureData;
    getProductData(type: string): IProductData;
    getBadgeUrl(name: string): string;
    getGroupBadgeUrl(name: string): string;
    getBadgeImage(name: string): Texture;
    getUserTags(roomUnitId: number): string[];
    loadBadgeImage(name: string): string;
    getGroupBadgeImage(name: string): Texture;
    loadGroupBadgeImage(name: string): string;
    hasSecurity(level: number): boolean;
    giveRespect(userId: number): void;
    givePetRespect(petId: number): void;
    sendSpecialCommandMessage(text: string, styleId?: number): void;
    ignoreUser(name: string): void;
    unignoreUser(name: string): void;
    isUserIgnored(name: string): boolean;
    getGroupBadge(groupId: number): string;
    userId: number;
    userName: string;
    figure: string;
    gender: string;
    realName: string;
    ignoredUsersManager: IIgnoredUsersManager;
    groupInformationManager: IGroupInformationManager;
    respectsReceived: number;
    respectsLeft: number;
    respectsPetLeft: number;
    canChangeName: boolean;
    clubLevel: number;
    securityLevel: number;
    isAmbassador: boolean;
    isEmailVerified: boolean;
    isSafetyLocked: boolean;
    isNoob: boolean;
    isRealNoob: boolean;
    isSystemOpen: boolean;
    isSystemShutdown: boolean;
    isAuthenticHabbo: boolean;
    isModerator: boolean;
    isCameraFollowDisabled: boolean;
    uiFlags: number;
    tags: string[];
    getUserDataSnapshot(): Readonly<IUserDataSnapshot>;
    /**
     * Referentially-stable view of the resolved permission map for
     * the current user. Invalidated by `USER_PERMISSIONS_UPDATED`.
     * Empty when the connected emulator doesn't ship the extended
     * `UserPermissionsMapComposer` (Arcturus ≥ 4.2.10).
     */
    getPermissionsSnapshot(): ReadonlyMap<string, number>;
}

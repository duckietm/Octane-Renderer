import { IRoomSession } from './IRoomSession';

export interface IRoomSessionSnapshot
{
    roomId: number;
    state: string;
    isRoomOwner: boolean;
    isSpectator: boolean;
    isDecorating: boolean;
    isGuildRoom: boolean;
    isPrivateRoom: boolean;
    controllerLevel: number;
    doorMode: number;
    tradeMode: number;
    allowPets: boolean;
    groupId: number;
    session: IRoomSession;
}

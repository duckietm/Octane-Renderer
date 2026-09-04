import { IRoomSession, IUserDataManager, RoomControllerLevel, RoomTradingLevelEnum } from '@nitrots/api';
import { BotRemoveComposer, ChangeQueueMessageComposer, CompostPlantMessageComposer, FurnitureMultiStateComposer, GetCommunication, GetPetCommandsComposer, HarvestPetMessageComposer, MoodlightSettingsComposer, MoodlightSettingsSaveComposer, MoodlightTogggleStateComposer, NewUserExperienceScriptProceedComposer, OpenPetPackageMessageComposer, OpenPresentComposer, PeerUsersClassificationMessageComposer, PetMountComposer, PetRemoveComposer, PollAnswerComposer, PollRejectComposer, PollStartComposer, RemovePetSaddleComposer, RoomAmbassadorAlertComposer, RoomBanUserComposer, RoomDoorbellAccessComposer, RoomEnterComposer, RoomGiveRightsComposer, RoomKickUserComposer, RoomModerationSettings, RoomMuteUserComposer, RoomTakeRightsComposer, RoomUnitActionComposer, RoomUnitBackgroundComposer, RoomUnitChatComposer, RoomUnitChatShoutComposer, RoomUnitChatWhisperComposer, RoomUnitDanceComposer, RoomUnitPostureComposer, RoomUnitSignComposer, RoomUnitTypingStartComposer, RoomUnitTypingStopComposer, RoomUsersClassificationMessageComposer, SetClothingChangeDataMessageComposer, TogglePetBreedingComposer, TogglePetRidingComposer, UsePetProductComposer, UserMottoComposer, VotePollCounterMessageComposer } from '@nitrots/communication';
import { RoomSessionEvent } from '@nitrots/events';
import { UserDataManager } from './UserDataManager';

export class RoomSession implements IRoomSession
{
    private _userData: IUserDataManager = new UserDataManager();

    private _roomId: number = 0;
    private _password: string = null;
    private _spawnX: number = -1;
    private _spawnY: number = -1;
    private _state: string = RoomSessionEvent.CREATED;
    private _tradeMode: number = RoomTradingLevelEnum.NO_TRADING;
    private _doorMode: number = 0;
    private _allowPets: boolean = false;
    private _controllerLevel: number = RoomControllerLevel.NONE;
    private _ownRoomIndex: number = -1;
    private _groupId: number = 0;
    private _hotelTimeZone: string = 'UTC';
    private _hotelTimeSnapshotMs: number = 0;
    private _hotelTimeSyncMs: number = 0;
    private _roomItemLimit: number = 0;
    private _isGuildRoom: boolean = false;
    private _isRoomOwner: boolean = false;
    private _isDecorating: boolean = false;
    private _isSpectator: boolean = false;

    private _moderationSettings: RoomModerationSettings = null;

    public setControllerLevel(level: number): void
    {
        if((level >= RoomControllerLevel.NONE) && (level <= RoomControllerLevel.MODERATOR))
        {
            this._controllerLevel = level;

            return;
        }

        this._controllerLevel = RoomControllerLevel.NONE;
    }

    public setOwnRoomIndex(roomIndex: number): void
    {
        this._ownRoomIndex = roomIndex;
    }

    public setRoomOwner(): void
    {
        this._isRoomOwner = true;
    }

    public start(): boolean
    {
        if(this._state !== RoomSessionEvent.CREATED || !GetCommunication().connection) return false;

        this._state = RoomSessionEvent.STARTED;

        return this.enterRoom();
    }

    private enterRoom(): boolean
    {
        if(!GetCommunication().connection) return false;

        GetCommunication().connection.send(new RoomEnterComposer(this._roomId, this._password, this._spawnX, this._spawnY));

        return true;
    }

    public reset(roomId: number): void
    {
        if(roomId === this._roomId) return;

        this._roomId = roomId;
    }

    public sendChatMessage(text: string, styleId: number, chatColour: string): void
    {
        GetCommunication().connection.send(new RoomUnitChatComposer(text, styleId, chatColour));
    }

    public sendShoutMessage(text: string, styleId: number, chatColour: string): void
    {
        GetCommunication().connection.send(new RoomUnitChatShoutComposer(text, styleId, chatColour));
    }

    public sendWhisperMessage(recipientName: string, text: string, styleId: number): void
    {
        GetCommunication().connection.send(new RoomUnitChatWhisperComposer(recipientName, text, styleId));
    }

    public sendChatTypingMessage(isTyping: boolean): void
    {
        if(isTyping) GetCommunication().connection.send(new RoomUnitTypingStartComposer());
        else GetCommunication().connection.send(new RoomUnitTypingStopComposer());
    }

    public sendBackgroundMessage(backgroundImage: number, backgroundStand: number, backgroundOverlay: number, backgroundCard: number = 0, backgroundBorder: number = 0): void
    {
        GetCommunication().connection.send(new RoomUnitBackgroundComposer(backgroundImage, backgroundStand, backgroundOverlay, backgroundCard, backgroundBorder));
    }

    public sendMottoMessage(motto: string): void
    {
        GetCommunication().connection.send(new UserMottoComposer(motto));
    }

    public sendDanceMessage(danceId: number): void
    {
        GetCommunication().connection.send(new RoomUnitDanceComposer(danceId));
    }

    public sendExpressionMessage(expression: number): void
    {
        GetCommunication().connection.send(new RoomUnitActionComposer(expression));
    }

    public sendSignMessage(sign: number): void
    {
        if((sign < 0) || (sign > 17)) return;

        GetCommunication().connection.send(new RoomUnitSignComposer(sign));
    }

    public sendPostureMessage(posture: number): void
    {
        GetCommunication().connection.send(new RoomUnitPostureComposer(posture));
    }

    public sendDoorbellApprovalMessage(userName: string, flag: boolean): void
    {
        GetCommunication().connection.send(new RoomDoorbellAccessComposer(userName, flag));
    }

    public sendAmbassadorAlertMessage(userId: number): void
    {
        GetCommunication().connection.send(new RoomAmbassadorAlertComposer(userId));
    }

    public sendKickMessage(userId: number): void
    {
        GetCommunication().connection.send(new RoomKickUserComposer(userId));
    }

    public sendMuteMessage(userId: number, minutes: number): void
    {
        GetCommunication().connection.send(new RoomMuteUserComposer(userId, minutes, this._roomId));
    }

    public sendBanMessage(userId: number, type: string): void
    {
        GetCommunication().connection.send(new RoomBanUserComposer(userId, this._roomId, type));
    }

    public sendGiveRightsMessage(userId: number): void
    {
        GetCommunication().connection.send(new RoomGiveRightsComposer(userId));
    }

    public sendTakeRightsMessage(userId: number): void
    {
        GetCommunication().connection.send(new RoomTakeRightsComposer(userId));
    }

    public sendPollStartMessage(pollId: number): void
    {
        GetCommunication().connection.send(new PollStartComposer(pollId));
    }

    public sendPollRejectMessage(pollId: number): void
    {
        GetCommunication().connection.send(new PollRejectComposer(pollId));
    }

    public sendPollAnswerMessage(pollId: number, questionId: number, answers: string[]): void
    {
        GetCommunication().connection.send(new PollAnswerComposer(pollId, questionId, answers));
    }

    public sendPeerUsersClassificationMessage(userClassType: string): void
    {
        GetCommunication().connection.send(new PeerUsersClassificationMessageComposer(userClassType));
    }

    public sendOpenPetPackageMessage(objectId: number, petName: string): void
    {
        GetCommunication().connection.send(new OpenPetPackageMessageComposer(objectId, petName));
    }

    public sendRoomUsersClassificationMessage(userClassType: string): void
    {
        GetCommunication().connection.send(new RoomUsersClassificationMessageComposer(userClassType));
    }

    public updateMoodlightData(id: number, effectId: number, color: number, brightness: number, apply: boolean): void
    {
        let colorString = '000000' + color.toString(16).toUpperCase();
        colorString = '#' + colorString.substring((colorString.length - 6));

        GetCommunication().connection.send(new MoodlightSettingsSaveComposer(id, effectId, colorString, brightness, apply));
    }

    public toggleMoodlightState(): void
    {
        GetCommunication().connection.send(new MoodlightTogggleStateComposer());
    }

    public pickupPet(id: number): void
    {
        if(!GetCommunication().connection) return;

        GetCommunication().connection.send(new PetRemoveComposer(id));
    }

    public pickupBot(id: number): void
    {
        if(!GetCommunication().connection) return;

        GetCommunication().connection.send(new BotRemoveComposer(id));
    }

    public requestMoodlightSettings(): void
    {
        if(!GetCommunication().connection) return;

        GetCommunication().connection.send(new MoodlightSettingsComposer());
    }

    public openGift(objectId: number): void
    {
        GetCommunication().connection.send(new OpenPresentComposer(objectId));
    }

    public mountPet(id: number): void
    {
        GetCommunication().connection.send(new PetMountComposer(id, true));
    }

    public dismountPet(id: number): void
    {
        GetCommunication().connection.send(new PetMountComposer(id, false));
    }

    public usePetProduct(itemId: number, petId: number): void
    {
        GetCommunication().connection.send(new UsePetProductComposer(itemId, petId));
    }

    public removePetSaddle(id: number): void
    {
        GetCommunication().connection.send(new RemovePetSaddleComposer(id));
    }

    public togglePetBreeding(id: number): void
    {
        GetCommunication().connection.send(new TogglePetBreedingComposer(id));
    }

    public togglePetRiding(id: number): void
    {
        GetCommunication().connection.send(new TogglePetRidingComposer(id));
    }

    public useMultistateItem(id: number): void
    {
        GetCommunication().connection.send(new FurnitureMultiStateComposer(id));
    }

    public harvestPet(id: number): void
    {
        GetCommunication().connection.send(new HarvestPetMessageComposer(id));
    }

    public compostPlant(id: number): void
    {
        GetCommunication().connection.send(new CompostPlantMessageComposer(id));
    }

    public requestPetCommands(id: number):void
    {
        GetCommunication().connection.send(new GetPetCommandsComposer(id));
    }

    public sendScriptProceed(): void
    {
        GetCommunication().connection.send(new NewUserExperienceScriptProceedComposer());
    }

    public sendUpdateClothingChangeFurniture(objectId: number, gender: string, look: string):void
    {
        GetCommunication().connection.send(new SetClothingChangeDataMessageComposer(objectId, gender, look));
    }

    public changeQueue(targetQueue: number): void
    {
        GetCommunication().connection.send(new ChangeQueueMessageComposer(targetQueue));
    }

    public votePoll(counter: number): void
    {
        GetCommunication().connection.send(new VotePollCounterMessageComposer(counter));
    }

    public get userDataManager(): IUserDataManager
    {
        return this._userData;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public set roomId(roomId: number)
    {
        this._roomId = roomId;
    }

    public get password(): string
    {
        return this._password;
    }

    public set password(password: string)
    {
        this._password = password;
    }

    public get spawnX(): number
    {
        return this._spawnX;
    }

    public set spawnX(x: number)
    {
        this._spawnX = x;
    }

    public get spawnY(): number
    {
        return this._spawnY;
    }

    public set spawnY(y: number)
    {
        this._spawnY = y;
    }

    public get state(): string
    {
        return this._state;
    }

    public get isPrivateRoom(): boolean
    {
        return true;
    }

    public get tradeMode(): number
    {
        return this._tradeMode;
    }

    public set tradeMode(mode: number)
    {
        this._tradeMode = mode;
    }

    public get doorMode(): number
    {
        return this._doorMode;
    }

    public set doorMode(mode: number)
    {
        this._doorMode = mode;
    }

    public get allowPets(): boolean
    {
        return this._allowPets;
    }

    public set allowPets(flag: boolean)
    {
        this._allowPets = flag;
    }

    public get controllerLevel(): number
    {
        return this._controllerLevel;
    }

    public get ownRoomIndex(): number
    {
        return this._ownRoomIndex;
    }

    public get groupId(): number
    {
        return this._groupId;
    }

    public set groupId(groupId: number)
    {
        this._groupId = groupId;
    }

    public get hotelTimeZone(): string
    {
        return this._hotelTimeZone;
    }

    public set hotelTimeZone(timeZone: string)
    {
        this._hotelTimeZone = (timeZone || 'UTC');
    }

    public get hotelTimeSnapshotMs(): number
    {
        return this._hotelTimeSnapshotMs;
    }

    public set hotelTimeSnapshotMs(value: number)
    {
        this._hotelTimeSnapshotMs = value;
    }

    public get hotelTimeSyncMs(): number
    {
        return this._hotelTimeSyncMs;
    }

    public set hotelTimeSyncMs(value: number)
    {
        this._hotelTimeSyncMs = value;
    }

    public get roomItemLimit(): number
    {
        return this._roomItemLimit;
    }

    public set roomItemLimit(value: number)
    {
        this._roomItemLimit = value;
    }

    public get isGuildRoom(): boolean
    {
        return this._isGuildRoom;
    }

    public set isGuildRoom(flag: boolean)
    {
        this._isGuildRoom = flag;
    }

    public get isRoomOwner(): boolean
    {
        return this._isRoomOwner;
    }

    public get isDecorating(): boolean
    {
        return this._isDecorating;
    }

    public set isDecorating(flag: boolean)
    {
        this._isDecorating = flag;
    }

    public get isSpectator(): boolean
    {
        return this._isSpectator;
    }

    public set isSpectator(flag: boolean)
    {
        this._isSpectator = flag;
    }

    public get moderationSettings(): RoomModerationSettings
    {
        return this._moderationSettings;
    }

    public set moderationSettings(parser: RoomModerationSettings)
    {
        this._moderationSettings = parser;
    }
}

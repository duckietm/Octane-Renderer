import { IMessageComposer } from '@octane/api';

/** Sent as the profile banner or accent, it tells the server to keep the saved one. */
export const KEEP_PROFILE_CUSTOMIZATION = -1;

/** Sent as the avatar direction, it tells the server to keep the saved pose (direction and offset). */
export const KEEP_PROFILE_AVATAR_POSE = -1;

export class RoomUnitBackgroundComposer implements IMessageComposer<ConstructorParameters<typeof RoomUnitBackgroundComposer>>
{
    private _data: ConstructorParameters<typeof RoomUnitBackgroundComposer>;

    constructor(backgroundImage: number, backgroundStand: number, backgroundOverlay: number, backgroundCard: number = 0, backgroundBorder: number = 0, profileBanner: number = KEEP_PROFILE_CUSTOMIZATION, profileAccent: number = KEEP_PROFILE_CUSTOMIZATION, avatarDirection: number = KEEP_PROFILE_AVATAR_POSE, avatarOffsetX: number = 0, avatarOffsetY: number = 0)
    {
        this._data = [ backgroundImage, backgroundStand, backgroundOverlay, backgroundCard, backgroundBorder, profileBanner, profileAccent, avatarDirection, avatarOffsetX, avatarOffsetY ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

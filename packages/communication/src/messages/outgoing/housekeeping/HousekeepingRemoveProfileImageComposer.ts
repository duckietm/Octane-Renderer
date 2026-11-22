import { IMessageComposer } from '@octane/api';

/** Removes one uploaded profile picture from the review list; with `block` its owner can no longer upload. */
export class HousekeepingRemoveProfileImageComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingRemoveProfileImageComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingRemoveProfileImageComposer>;

    constructor(pictureId: number, block: boolean)
    {
        this._data = [pictureId, block];
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

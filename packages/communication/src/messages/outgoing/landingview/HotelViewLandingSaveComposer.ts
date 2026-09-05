import { IMessageComposer } from '@octane/api';
import { IHotelViewLandingSlot } from '../../parser';

export class HotelViewLandingSaveComposer implements IMessageComposer<(number | string | boolean)[]>
{
    private _data: (number | string | boolean)[];

    constructor(slot: IHotelViewLandingSlot)
    {
        this._data = [slot.id, slot.enabled, slot.type, slot.title, slot.body, slot.imageUrl, slot.buttonText, slot.link, slot.progress, slot.progressLabel, slot.configJson];
    }

    public getMessageArray(): (number | string | boolean)[]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}

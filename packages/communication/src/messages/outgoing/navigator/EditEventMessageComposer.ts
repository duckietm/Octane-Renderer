import { IMessageComposer } from '@octane/api';

export class EditEventMessageComposer implements IMessageComposer<ConstructorParameters<typeof EditEventMessageComposer>>
{
    private _data: ConstructorParameters<typeof EditEventMessageComposer>;

    constructor(eventId: number, eventName: string, eventDescription: string)
    {
        this._data = [eventId, eventName, eventDescription];
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

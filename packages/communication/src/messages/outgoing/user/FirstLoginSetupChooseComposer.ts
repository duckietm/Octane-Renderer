import { IMessageComposer } from '@octane/api';

/**
 * Custom answer to the first-login setup (9497): the starter room's template id, or 0 for none. The
 * offer ends either way.
 */
export class FirstLoginSetupChooseComposer implements IMessageComposer<[number]>
{
    public static NO_ROOM: number = 0;

    private _data: [number];

    constructor(templateId: number = FirstLoginSetupChooseComposer.NO_ROOM)
    {
        this._data = [templateId];
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

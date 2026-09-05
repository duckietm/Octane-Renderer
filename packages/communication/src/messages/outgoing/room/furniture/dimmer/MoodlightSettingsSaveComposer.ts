import { IMessageComposer } from '@octane/api';

export class MoodlightSettingsSaveComposer implements IMessageComposer<ConstructorParameters<typeof MoodlightSettingsSaveComposer>>
{
    private _data: ConstructorParameters<typeof MoodlightSettingsSaveComposer>;

    constructor(presetId: number, effectId: number, color: string, brightness: number, apply: boolean)
    {
        this._data = [presetId, effectId, color, brightness, apply];
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

import { IMessageComposer } from '@nitrots/api';

/**
 * Saves a wired chest's settings.
 * [itemId, name, description, accessOpen, accessDonate, appearanceState, locked, capacity].
 *
 * The lock and the ceiling travel with the rest because the official window saves them together:
 * one message, one confirmation, no half-applied state.
 */
export class ChestSaveSettingsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveSettingsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveSettingsComposer>;

    constructor(
        itemId: number,
        name: string,
        description: string,
        accessOpen: boolean,
        accessDonate: boolean,
        appearanceState: number,
        locked: boolean,
        capacity: number)
    {
        this._data = [itemId, name, description, accessOpen, accessDonate, appearanceState, locked, capacity];
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

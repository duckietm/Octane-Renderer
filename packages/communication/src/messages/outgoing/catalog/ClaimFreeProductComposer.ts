import { IMessageComposer } from '@octane/api';

/**
 * Official free claim (3935): `claimId`, then the choice when the window offers one. The special items
 * display sends the claim id alone; the cursed dragon adoption adds 0 (blue) or 1 (purple).
 */
export class ClaimFreeProductComposer implements IMessageComposer<(string | number)[]>
{
    public static NO_CHOICE: number = -1;

    private _data: (string | number)[];

    constructor(claimId: string, choice: number = ClaimFreeProductComposer.NO_CHOICE)
    {
        this._data = [claimId];

        if(choice !== ClaimFreeProductComposer.NO_CHOICE) this._data.push(choice);
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

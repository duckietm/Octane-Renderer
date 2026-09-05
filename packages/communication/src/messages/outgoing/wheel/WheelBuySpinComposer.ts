import { IMessageComposer } from '@octane/api';

export class WheelBuySpinComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }
    public dispose(): void
    {
        return;
    }
}

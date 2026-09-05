import { IMessageComposer } from '@octane/api';

export class WheelSpinComposer implements IMessageComposer<[]>
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

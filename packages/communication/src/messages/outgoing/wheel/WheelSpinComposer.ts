import { IMessageComposer } from '@nitrots/api';

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

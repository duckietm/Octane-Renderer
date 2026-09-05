import { IMessageComposer } from '@octane/api';

export class WheelOpenComposer implements IMessageComposer<[]>
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

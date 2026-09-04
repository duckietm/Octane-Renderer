import { IMessageComposer } from '@nitrots/api';

export class WheelAdminGetPrizesComposer implements IMessageComposer<[]>
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

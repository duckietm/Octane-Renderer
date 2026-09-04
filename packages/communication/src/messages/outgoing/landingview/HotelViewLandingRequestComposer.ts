import { IMessageComposer } from '@nitrots/api';

export class HotelViewLandingRequestComposer implements IMessageComposer<[]>
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

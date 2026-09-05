import { IMessageComposer } from '@octane/api';

export class GetRecyclerPrizesMessageComposer implements IMessageComposer<[]>
{
    public dispose(): void
    {}

    public getMessageArray(): []
    {
        return [];
    }
}

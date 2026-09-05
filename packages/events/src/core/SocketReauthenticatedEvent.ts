import { OctaneEvent } from './OctaneEvent';

export class SocketReauthenticatedEvent extends OctaneEvent
{
    constructor(type: string, public readonly sessionResumed: boolean, public readonly roomId: number)
    {
        super(type);
    }
}

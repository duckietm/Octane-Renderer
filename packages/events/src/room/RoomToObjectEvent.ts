import { OctaneEvent } from '../core';

export class RoomToObjectEvent extends OctaneEvent
{
    public constructor(type: string)
    {
        super(type);
    }
}

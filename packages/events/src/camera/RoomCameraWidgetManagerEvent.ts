import { OctaneEvent } from '../core';

export class RoomCameraWidgetManagerEvent extends OctaneEvent
{
    public static INITIALIZED: string = 'RCWM_INITIALIZED';

    constructor(type: string)
    {
        super(type);
    }
}

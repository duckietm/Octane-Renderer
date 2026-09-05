import { OctaneEvent } from './OctaneEvent';

export class ConfigurationEvent extends OctaneEvent
{
    public static LOADED: string = 'NCE_LOADED';
    public static FAILED: string = 'NCE_FAILED';

    constructor(type: string)
    {
        super(type);
    }
}

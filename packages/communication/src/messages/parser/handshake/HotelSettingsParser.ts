import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * The hotel settings the server sends with the login state: the address photos are published under, the lengths it
 * enforces and the words after @ it treats as mentions. A length of 0 means the server set none.
 */
export class HotelSettingsParser implements IMessageParser
{
    public protocolVersion = 0;
    public cameraUrl = '';
    public chatMaxLength = 0;
    public mottoMaxLength = 0;
    public botNameMaxLength = 0;
    public petNameMaxLength = 0;
    public everyoneAliases: string[] = [];
    public friendsAliases: string[] = [];
    public roomAliases: string[] = [];

    public flush(): boolean
    {
        this.protocolVersion = 0;
        this.cameraUrl = '';
        this.chatMaxLength = 0;
        this.mottoMaxLength = 0;
        this.botNameMaxLength = 0;
        this.petNameMaxLength = 0;
        this.everyoneAliases = [];
        this.friendsAliases = [];
        this.roomAliases = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();

        if(!wrapper) return false;

        this.protocolVersion = wrapper.readInt();
        this.cameraUrl = wrapper.readString();
        this.chatMaxLength = wrapper.readInt();
        this.mottoMaxLength = wrapper.readInt();
        this.botNameMaxLength = wrapper.readInt();
        this.petNameMaxLength = wrapper.readInt();
        this.everyoneAliases = HotelSettingsParser.aliases(wrapper.readString());
        this.friendsAliases = HotelSettingsParser.aliases(wrapper.readString());
        this.roomAliases = HotelSettingsParser.aliases(wrapper.readString());

        return this.protocolVersion >= 1;
    }

    private static aliases(list: string): string[]
    {
        return (list || '').split(',').map(alias => alias.trim()).filter(alias => alias.length > 0);
    }
}

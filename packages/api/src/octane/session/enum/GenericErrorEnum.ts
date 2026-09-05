export class GenericErrorEnum
{
    public static readonly AUTHENTICATION_FAILED = -3;
    public static readonly CONNECTING_TO_SERVER_FAILED = -400;
    public static readonly KICKED_OUT_OF_ROOM = 4008;
    public static readonly VIP_REQUIRED = 4009;
    public static readonly ROOM_NAME_UNACCEPTABLE = 4010;
    public static readonly CANNOT_BAN_GROUP_MEMBER = 4011;
    public static readonly WRONG_ROOM_PASSWORD = -100002;
    public static readonly TRADE_STRIP_LOCKED = -13001;

    /** @deprecated Use TRADE_STRIP_LOCKED. */
    public static get STRIP_LOCKED_FOR_TRADING(): number
    {
        return GenericErrorEnum.TRADE_STRIP_LOCKED;
    }
}

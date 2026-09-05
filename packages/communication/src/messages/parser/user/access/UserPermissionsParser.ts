import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class UserPermissionsParser implements IMessageParser
{
    private _clubLevel: number;
    private _securityLevel: number;
    private _isAmbassador: boolean;
    private _rankId: number;
    private _rankName: string;
    private _rankBadge: string;
    private _rankPrefix: string;
    private _rankPrefixColor: string;
    private _permissions: Map<string, number> = new Map();

    public flush(): boolean
    {
        this._clubLevel = 0;
        this._securityLevel = 0;
        this._isAmbassador = false;
        this._rankId = 0;
        this._rankName = '';
        this._rankBadge = '';
        this._rankPrefix = '';
        this._rankPrefixColor = '';
        this._permissions = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._clubLevel = wrapper.readInt();
        this._securityLevel = wrapper.readInt();
        this._isAmbassador = wrapper.readBoolean();

        // Optional trailing block (Arcturus-Morningstar-Extended ≥ 4.2.10):
        // rank metadata + resolved permission map appended in a
        // backward-compatible way. Older emulators don't write these
        // bytes so we keep the defaults from flush().
        if(!wrapper.bytesAvailable) return true;

        this._rankId = wrapper.readInt();
        this._rankName = wrapper.readString();
        this._rankBadge = wrapper.readString();
        this._rankPrefix = wrapper.readString();
        this._rankPrefixColor = wrapper.readString();

        if(!wrapper.bytesAvailable) return true;

        // Resolved permission map: int count + (string key, int value)*.
        // value 1 = ALLOWED, 2 = ROOM_OWNER. Only entries with
        // PermissionSetting != DISALLOWED are sent; absence on the client
        // means "no" (useHasPermission(key) returns false).
        const count = wrapper.readInt();
        const permissions = new Map<string, number>();

        for(let i = 0; i < count; i++)
        {
            const key = wrapper.readString();
            const value = wrapper.readInt();

            permissions.set(key, value);
        }

        this._permissions = permissions;

        return true;
    }

    public get clubLevel(): number
    {
        return this._clubLevel;
    }

    public get securityLevel(): number
    {
        return this._securityLevel;
    }

    public get isAmbassador(): boolean
    {
        return this._isAmbassador;
    }

    public get rankId(): number
    {
        return this._rankId;
    }

    public get rankName(): string
    {
        return this._rankName;
    }

    public get rankBadge(): string
    {
        return this._rankBadge;
    }

    public get rankPrefix(): string
    {
        return this._rankPrefix;
    }

    public get rankPrefixColor(): string
    {
        return this._rankPrefixColor;
    }

    public get permissions(): ReadonlyMap<string, number>
    {
        return this._permissions;
    }
}

import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * A message a server plugin sends on one of its channels: the channel name and a JSON payload. The channel decides
 * what the payload means; the renderer only carries it. {@link getData} parses the payload once, and gives null for a
 * payload that is not a JSON object, so a panel never has to guard against a broken one.
 */
export class PluginChannelMessageParser implements IMessageParser
{
    private _channel = '';
    private _payload = '';
    private _data: Record<string, unknown> | null | undefined = undefined;

    public flush(): boolean
    {
        this._channel = '';
        this._payload = '';
        this._data = undefined;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._channel = wrapper.readString();
        this._payload = wrapper.readString();
        this._data = undefined;

        return true;
    }

    public get channel(): string
    {
        return this._channel;
    }

    /** The payload as the plugin sent it. */
    public get payload(): string
    {
        return this._payload;
    }

    /** The payload as a JSON object, or null when it is not one. */
    public getData(): Record<string, unknown> | null
    {
        if(this._data !== undefined) return this._data;

        try
        {
            const parsed: unknown = JSON.parse(this._payload);

            this._data = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed as Record<string, unknown> : null;
        }
        catch
        {
            this._data = null;
        }

        return this._data;
    }
}

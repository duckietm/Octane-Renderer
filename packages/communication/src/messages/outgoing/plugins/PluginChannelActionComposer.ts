import { IMessageComposer } from '@octane/api';

/**
 * An action a client panel sends to its server plugin on a channel: the channel name and a JSON payload the plugin
 * reads. The server limits how often these arrive and how long they may be.
 */
export class PluginChannelActionComposer implements IMessageComposer<ConstructorParameters<typeof PluginChannelActionComposer>>
{
    private _data: ConstructorParameters<typeof PluginChannelActionComposer>;

    constructor(channel: string, payload: string)
    {
        this._data = [ channel, payload ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

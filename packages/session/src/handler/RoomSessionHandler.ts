import { IConnection, IRoomHandlerListener } from '@octane/api';
import { DesktopViewEvent, FlatAccessDeniedMessageEvent, GoToFlatMessageComposer, RoomDoorbellAcceptedEvent, RoomEnterErrorEvent, RoomEnterEvent, RoomReadyMessageEvent, YouAreSpectatorMessageEvent } from '@octane/communication';
import { GetEventDispatcher, RoomSessionDoorbellEvent, RoomSessionSpectatorModeEvent } from '@octane/events';
import { OctaneLogger } from '@octane/utils';
import { BaseHandler } from './BaseHandler';

export class RoomSessionHandler extends BaseHandler
{
    public static RS_CONNECTED: string = 'RS_CONNECTED';
    public static RS_READY: string = 'RS_READY';
    public static RS_DISCONNECTED: string = 'RS_DISCONNECTED';
    // The server refused the entry (banned, full, ...). The client's navigator leaves the room for it, except while a
    // reconnect is restoring the session: then the session manager has to.
    public static RS_REFUSED: string = 'RS_REFUSED';

    constructor(connection: IConnection, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        connection.addMessageEvent(new RoomEnterEvent(this.onRoomEnterEvent.bind(this)));
        connection.addMessageEvent(new RoomReadyMessageEvent(this.onRoomReadyMessageEvent.bind(this)));
        connection.addMessageEvent(new DesktopViewEvent(this.onDesktopViewEvent.bind(this)));
        connection.addMessageEvent(new RoomDoorbellAcceptedEvent(this.onRoomDoorbellAcceptedEvent.bind(this)));
        connection.addMessageEvent(new FlatAccessDeniedMessageEvent(this.onRoomDoorbellRejectedEvent.bind(this)));
        connection.addMessageEvent(new YouAreSpectatorMessageEvent(this.onYouAreSpectatorMessageEvent.bind(this)));
        connection.addMessageEvent(new RoomEnterErrorEvent(this.onRoomEnterErrorEvent.bind(this)));
    }

    private onRoomEnterErrorEvent(event: RoomEnterErrorEvent): void
    {
        if(!(event instanceof RoomEnterErrorEvent)) return;

        if(this.listener) this.listener.sessionUpdate(this.roomId, RoomSessionHandler.RS_REFUSED);
    }

    private onRoomEnterEvent(event: RoomEnterEvent): void
    {
        if(!(event instanceof RoomEnterEvent)) return;

        if(this.listener) this.listener.sessionUpdate(this.roomId, RoomSessionHandler.RS_CONNECTED);
    }

    private onRoomReadyMessageEvent(event: RoomReadyMessageEvent): void
    {
        if(!(event instanceof RoomReadyMessageEvent)) return;

        const fromRoomId = this.roomId;
        const toRoomId = event.getParser().roomId;

        if(this.listener)
        {
            this.listener.sessionReinitialize(fromRoomId, toRoomId);
            this.listener.sessionUpdate(this.roomId, RoomSessionHandler.RS_READY);
        }
    }

    private onDesktopViewEvent(event: DesktopViewEvent): void
    {
        if(!(event instanceof DesktopViewEvent)) return;

        OctaneLogger.log('[RoomSessionHandler] DesktopViewEvent received (roomId=' + this.roomId + ')');

        if(this.listener) this.listener.sessionUpdate(this.roomId, RoomSessionHandler.RS_DISCONNECTED);
    }

    private onRoomDoorbellAcceptedEvent(event: RoomDoorbellAcceptedEvent): void
    {
        if(!(event instanceof RoomDoorbellAcceptedEvent) || !this.listener) return;

        const parser = event.getParser();

        if(!parser) return;

        const username = parser.userName;
        const flatId = this.flatIdOf(parser.flatId);

        if(!username || !username.length)
        {
            this.connection.send(new GoToFlatMessageComposer(flatId));
        }
        else
        {
            const session = this.listener.getSession(flatId);

            if(!session) return;

            GetEventDispatcher().dispatchEvent(new RoomSessionDoorbellEvent(RoomSessionDoorbellEvent.RSDE_ACCEPTED, session, username));
        }
    }

    private onRoomDoorbellRejectedEvent(event: FlatAccessDeniedMessageEvent): void
    {
        if(!(event instanceof FlatAccessDeniedMessageEvent) || !this.listener) return;

        const parser = event.getParser();

        if(!parser) return;

        const username = parser.userName;
        const flatId = this.flatIdOf(parser.flatId);

        if(!username || !username.length)
        {
            OctaneLogger.log('[RoomSessionHandler] FlatAccessDenied (empty username) → RS_DISCONNECTED (roomId=' + flatId + ')');
            this.listener.sessionUpdate(flatId, RoomSessionHandler.RS_DISCONNECTED);
        }
        else
        {
            const session = this.listener.getSession(flatId);

            if(!session) return;

            GetEventDispatcher().dispatchEvent(new RoomSessionDoorbellEvent(RoomSessionDoorbellEvent.RSDE_REJECTED, session, username));
        }
    }

    private onYouAreSpectatorMessageEvent(event: YouAreSpectatorMessageEvent): void
    {
        if(this.listener)
        {
            const session = this.listener.getSession(this.flatIdOf(event.getParser()?.flatId));

            if(!session) return;

            session.isSpectator = true;

            GetEventDispatcher().dispatchEvent(new RoomSessionSpectatorModeEvent(RoomSessionSpectatorModeEvent.SPECTATOR_MODE, session));
        }
    }

    /** The flat a room access packet names (AIR reads it first); a server that sends 0 means the current room. */
    private flatIdOf(flatId: number): number
    {
        return (flatId > 0) ? flatId : this.roomId;
    }
}

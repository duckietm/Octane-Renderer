import { IConnection, IRoomHandlerListener, RoomControllerLevel } from '@octane/api';
import { RoomRightsClearEvent, RoomRightsEvent, RoomRightsOwnerEvent } from '@octane/communication';
import { BaseHandler } from './BaseHandler';

export class RoomPermissionsHandler extends BaseHandler
{
    constructor(connection: IConnection, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        connection.addMessageEvent(new RoomRightsEvent(this.onRoomRightsEvent.bind(this)));
        connection.addMessageEvent(new RoomRightsClearEvent(this.onRoomRightsClearEvent.bind(this)));
        connection.addMessageEvent(new RoomRightsOwnerEvent(this.onRoomRightsOwnerEvent.bind(this)));
    }

    private onRoomRightsEvent(event: RoomRightsEvent): void
    {
        if(!(event instanceof RoomRightsEvent)) return;

        const session = this.listener.getSession(this.roomId);

        if(!session) return;

        session.setControllerLevel(event.getParser().controllerLevel);

        this.listener.invalidateRoomSessionSnapshot();
    }

    private onRoomRightsClearEvent(event: RoomRightsClearEvent): void
    {
        if(!(event instanceof RoomRightsClearEvent)) return;

        const session = this.listener.getSession(this.roomId);

        if(!session) return;

        session.setControllerLevel(RoomControllerLevel.NONE);

        this.listener.invalidateRoomSessionSnapshot();
    }

    private onRoomRightsOwnerEvent(event: RoomRightsOwnerEvent): void
    {
        if(!(event instanceof RoomRightsOwnerEvent)) return;

        const session = this.listener.getSession(this.roomId);

        if(!session) return;

        session.setRoomOwner();

        this.listener.invalidateRoomSessionSnapshot();
    }
}

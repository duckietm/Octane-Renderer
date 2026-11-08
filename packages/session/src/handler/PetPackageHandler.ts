import { IConnection, IRoomHandlerListener } from '@octane/api';
import { OpenPetPackageRequestedMessageEvent, OpenPetPackageResultMessageEvent } from '@octane/communication';
import { GetEventDispatcher, RoomSessionPetPackageEvent } from '@octane/events';
import { BaseHandler } from './BaseHandler';

export class PetPackageHandler extends BaseHandler
{
    constructor(connection: IConnection, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        connection.addMessageEvent(new OpenPetPackageRequestedMessageEvent(this.onOpenPetPackageRequested.bind(this)));
        connection.addMessageEvent(new OpenPetPackageResultMessageEvent(this.onOpenPetPackageResult.bind(this)));
    }

    private onOpenPetPackageRequested(event: OpenPetPackageRequestedMessageEvent): void
    {
        if(!this.listener) return;

        const parser = event.getParser();

        if(!parser) return;

        const session = this.listener.getSession(this.roomId);

        if(!session) return;

        GetEventDispatcher().dispatchEvent(new RoomSessionPetPackageEvent(RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_REQUESTED, session, parser.objectId, parser.figureData, 0, null));
    }

    private onOpenPetPackageResult(event: OpenPetPackageResultMessageEvent): void
    {
        if(!this.listener) return;

        const parser = event.getParser();

        if(!parser) return;

        const session = this.listener.getSession(this.roomId);

        if(!session) return;

        GetEventDispatcher().dispatchEvent(new RoomSessionPetPackageEvent(RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_RESULT, session, parser.objectId, null, parser.nameValidationStatus, parser.nameValidationInfo));
    }
}

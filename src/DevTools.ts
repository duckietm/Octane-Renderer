import { GetRoomEngine, RoomEngine } from '@octane/room';
export { };

declare global
{
	interface Window
	{
		OctaneDevTools?:
		{
            roomEngine: RoomEngine;
		};
	}
}

window.OctaneDevTools = {
    roomEngine: GetRoomEngine()
};

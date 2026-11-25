import { GetRoomEngine, RoomEngine } from '@octane/room';
export { };

declare global
{
	interface Window
	{
		OctaneDevTools?:
		{
            roomEngine: RoomEngine;
            setPlaneRenderMode: (mode: 'bake' | 'direct') => void;
            setAvatarAtlasMode: (enabled: boolean) => void;
		};
	}
}

window.OctaneDevTools = {
    roomEngine: GetRoomEngine(),
    setPlaneRenderMode: mode => GetRoomEngine().setPlaneRenderMode(mode === 'direct'),
    setAvatarAtlasMode: enabled => GetRoomEngine().setAvatarAtlasMode(enabled)
};

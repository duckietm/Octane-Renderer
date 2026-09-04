import { AvatarAction, RoomObjectCategory, RoomObjectVariable } from '@nitrots/api';
import { Point, Rectangle } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { RoomPreviewer } from './RoomPreviewer';

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

const makePreviewer = (category = RoomObjectCategory.FLOOR) =>
{
    let roomDirection = 90;
    const roomObject = {
        getDirection: () => ({ x: roomDirection }),
        getLocation: () => ({ x: 0.5, y: 2.3, z: 1.8 }),
        model: {
            getValue: vi.fn((variable) =>
            {
                if(variable === RoomObjectVariable.FURNITURE_SIZE_Z) return 1.4;
                if(variable === RoomObjectVariable.FURNITURE_CENTER_Z) return 0.25;

                return [ 0, 90, 180, 270 ];
            }),
            setValue: vi.fn()
        },
        setDirection: vi.fn((direction) =>
        {
            roomDirection = direction.x;
        })
    };
    const roomEngine = {
        changeObjectState: vi.fn(),
        getRoomInstanceGeometry: vi.fn(() => ({ isZoomedIn: () => false, performZoomIn: vi.fn(), performZoomOut: vi.fn() })),
        getRoomInstanceRenderingCanvasOffset: vi.fn(() => null),
        getRoomInstanceRenderingCanvasScale: vi.fn(() => 0.5),
        getRoomObject: vi.fn(() => roomObject),
        objectEventHandler: { getValidRoomObjectDirection: vi.fn((_object, clockwise) => (clockwise ? 180 : 0)) },
        setRoomInstanceRenderingCanvasScale: vi.fn(),
        updateRoomObjectFloor: vi.fn(),
        updateRoomObjectUserAction: vi.fn(),
        updateRoomObjectUserLocation: vi.fn(),
        updateRoomObjectUserPosture: vi.fn(),
        updateRoomObjectWallLocation: vi.fn()
    };
    const previewer = Object.create(RoomPreviewer.prototype) as RoomPreviewer;
    const internals = previewer as unknown as {
        _automaticStateChange: boolean;
        _currentAvatarAction: number;
        _currentAvatarDirection: number;
        _currentAvatarHeadDirection: number;
        _currentPreviewMode: string;
        _currentPreviewNeedsZoomOut: boolean;
        _currentPreviewObjectCategory: number;
        _currentPreviewRectangle: Rectangle;
        _currentPreviewScale: number;
        _currentPreviewCanvasHeight: number;
        _currentPreviewCanvasWidth: number;
        _addViewOffset: Point;
        _centerWallItems: boolean;
        getCanvasOffset(point: Point): Point;
        onRoomObjectAdded(event: object): void;
        validatePreviewSize(point: Point): Point;
        _previewCapabilities: object;
        _previewCapabilityListeners: Set<() => void>;
        refreshPreviewCapabilities(): void;
    };

    Object.assign(previewer, {
        _roomEngine: roomEngine,
        _previewRoomId: 77,
        _currentAvatarAction: 0,
        _currentAvatarDirection: 2,
        _currentAvatarHeadDirection: 3,
        _currentPreviewObjectCategory: category,
        _currentPreviewMode: 'floor',
        _currentPreviewRectangle: new Rectangle(),
        _currentPreviewCanvasHeight: 240,
        _currentPreviewCanvasWidth: 360,
        _addViewOffset: new Point(),
        _centerWallItems: false,
        _currentPreviewScale: RoomPreviewer.SCALE_NORMAL,
        _previewCapabilities: {
            mode: 'none',
            canRotate: false,
            canChangeState: false,
            canUseAvatarActions: false,
            canZoomIn: false,
            canZoomOut: false
        },
        _previewCapabilityListeners: new Set(),
        _automaticStateChange: true
    });

    return { previewer, internals, roomEngine, roomObject };
};

describe('RoomPreviewer catalog controls', () =>
{
    it('reports stable capabilities for the object that is actually loaded', () =>
    {
        const { previewer, internals } = makePreviewer();

        internals.refreshPreviewCapabilities();

        expect((previewer as any).getPreviewCapabilities()).toEqual({
            mode: 'floor',
            canRotate: true,
            canChangeState: true,
            canUseAvatarActions: false,
            canZoomIn: false,
            canZoomOut: true
        });
    });

    it('notifies subscribers when zoom availability changes', () =>
    {
        const { previewer, internals } = makePreviewer();
        const listener = vi.fn();
        const unsubscribe = (previewer as any).subscribePreviewCapabilities(listener);

        internals.refreshPreviewCapabilities();
        previewer.zoomOut();

        expect(listener).toHaveBeenCalled();
        expect((previewer as any).getPreviewCapabilities()).toMatchObject({ canZoomIn: true, canZoomOut: false });

        unsubscribe();
    });

    it('distinguishes avatar actions from furniture interactions', () =>
    {
        const { previewer, internals } = makePreviewer(RoomObjectCategory.UNIT);

        internals._currentPreviewMode = 'avatar';
        internals.refreshPreviewCapabilities();

        expect((previewer as any).getPreviewCapabilities()).toMatchObject({
            mode: 'avatar',
            canRotate: true,
            canChangeState: false,
            canUseAvatarActions: true
        });
    });

    it('keeps wall-item mirroring available without floor-direction metadata', () =>
    {
        const { previewer, internals, roomObject } = makePreviewer(RoomObjectCategory.WALL);

        internals._currentPreviewMode = 'wall';
        roomObject.model.getValue.mockImplementation(() => []);
        internals.refreshPreviewCapabilities();

        expect(previewer.getPreviewCapabilities()).toMatchObject({ mode: 'wall', canRotate: true });
    });

    it('cycles an avatar through walk, dance, sit, lay, wave and stand', () =>
    {
        const { previewer, internals, roomEngine } = makePreviewer(RoomObjectCategory.UNIT);

        internals._currentPreviewMode = 'avatar';

        previewer.cycleAvatarAction();
        expect(roomEngine.updateRoomObjectUserPosture).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, AvatarAction.POSTURE_WALK, '');

        previewer.cycleAvatarAction();
        expect(roomEngine.updateRoomObjectUserAction).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectVariable.FIGURE_DANCE, 1, null);

        previewer.cycleAvatarAction();
        expect(roomEngine.updateRoomObjectUserPosture).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, AvatarAction.POSTURE_SIT, '');
        expect(roomEngine.updateRoomObjectUserLocation).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, expect.objectContaining({ x: 2, y: 2, z: 0.55 }), expect.anything(), false, 0, expect.anything(), expect.any(Number));

        previewer.cycleAvatarAction();
        expect(roomEngine.updateRoomObjectUserPosture).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, AvatarAction.POSTURE_LAY, '');
        expect(roomEngine.updateRoomObjectUserLocation).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, expect.objectContaining({ x: 1, y: 1, z: 0 }), expect.anything(), false, 0, expect.anything(), expect.any(Number));

        previewer.cycleAvatarAction();
        expect(roomEngine.updateRoomObjectUserAction).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectVariable.FIGURE_EXPRESSION, AvatarAction.getExpressionId(AvatarAction.EXPRESSION_WAVE), null);

        previewer.cycleAvatarAction();
        expect(internals._currentAvatarAction).toBe(0);
        expect(roomEngine.updateRoomObjectUserPosture).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, AvatarAction.POSTURE_STAND, '');
    });

    it('skips avatar poses that are incompatible with the current direction', () =>
    {
        const { previewer, internals, roomEngine } = makePreviewer(RoomObjectCategory.UNIT);

        internals._currentPreviewMode = 'avatar';
        internals._currentAvatarAction = 2;
        internals._currentAvatarDirection = 1;

        previewer.cycleAvatarAction();

        expect(internals._currentAvatarAction).toBe(5);
        expect(roomEngine.updateRoomObjectUserAction).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectVariable.FIGURE_EXPRESSION, AvatarAction.getExpressionId(AvatarAction.EXPRESSION_WAVE), null);
    });

    it('keeps avatar rotation on valid directions for directional poses', () =>
    {
        const { previewer, internals, roomEngine } = makePreviewer(RoomObjectCategory.UNIT);

        internals._currentPreviewMode = 'avatar';
        internals._currentAvatarAction = 3;

        previewer.changeRoomObjectDirection(true);

        expect(internals._currentAvatarDirection).toBe(4);
        expect(roomEngine.updateRoomObjectUserLocation).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, expect.anything(), expect.anything(), false, 0, expect.objectContaining({ x: 180 }), 180);
    });

    it('keeps laying avatars on the two supported directions', () =>
    {
        const { previewer, internals } = makePreviewer(RoomObjectCategory.UNIT);

        internals._currentPreviewMode = 'avatar';
        internals._currentAvatarAction = 4;
        internals._currentAvatarDirection = 2;

        previewer.changeRoomObjectDirection(true);
        expect(internals._currentAvatarDirection).toBe(0);

        previewer.changeRoomObjectDirection(false);
        expect(internals._currentAvatarDirection).toBe(2);
    });

    it('keeps sitting, laying and waving anchored to the same floor reference', () =>
    {
        const { previewer, internals } = makePreviewer(RoomObjectCategory.UNIT);
        const floorReference = new Rectangle(-30, -110, 60, 120);

        internals._currentPreviewMode = 'avatar';
        internals._currentAvatarAction = 2;
        internals._currentPreviewRectangle = floorReference;

        previewer.cycleAvatarAction();
        expect(internals._currentPreviewRectangle).toBe(floorReference);

        previewer.cycleAvatarAction();
        expect(internals._currentPreviewRectangle).toBe(floorReference);

        previewer.cycleAvatarAction();
        expect(internals._currentPreviewRectangle).toBe(floorReference);
    });

    it('keeps a laying avatar anchored while rotating', () =>
    {
        const { previewer, internals } = makePreviewer(RoomObjectCategory.UNIT);
        const floorReference = new Rectangle(-30, -110, 60, 120);

        internals._currentPreviewMode = 'avatar';
        internals._currentAvatarAction = 4;
        internals._currentAvatarDirection = 2;
        internals._currentPreviewRectangle = floorReference;

        previewer.changeRoomObjectDirection(true);

        expect(internals._currentPreviewRectangle).toBe(floorReference);
    });

    it('rotates floor furniture in both requested directions and refreshes the preview', () =>
    {
        const { previewer, roomEngine } = makePreviewer();

        previewer.changeRoomObjectDirection(false);
        previewer.changeRoomObjectDirection(true);

        expect(roomEngine.objectEventHandler.getValidRoomObjectDirection).toHaveBeenNthCalledWith(1, expect.anything(), false);
        expect(roomEngine.objectEventHandler.getValidRoomObjectDirection).toHaveBeenNthCalledWith(2, expect.anything(), true);
        expect(roomEngine.updateRoomObjectFloor).toHaveBeenNthCalledWith(1, 77, RoomPreviewer.PREVIEW_OBJECT_ID, expect.anything(), expect.objectContaining({ x: 0 }), null, null);
        expect(roomEngine.updateRoomObjectFloor).toHaveBeenNthCalledWith(2, 77, RoomPreviewer.PREVIEW_OBJECT_ID, expect.anything(), expect.objectContaining({ x: 180 }), null, null);
    });

    it('mirrors wall furniture around the preview corner and preserves its visual center height', () =>
    {
        const { previewer, internals, roomEngine, roomObject } = makePreviewer(RoomObjectCategory.WALL);

        internals._currentPreviewMode = 'wall';
        previewer.changeRoomObjectDirection(true);

        expect(roomObject.setDirection).toHaveBeenCalledWith(expect.objectContaining({ x: 180 }));
        expect(roomEngine.updateRoomObjectWallLocation).toHaveBeenCalledWith(
            77,
            RoomPreviewer.PREVIEW_OBJECT_ID,
            expect.objectContaining({ x: 2.3, y: 0.5, z: 1.35 })
        );
    });

    it('enables the invisible visualization layer when a furniture preview becomes available', () =>
    {
        const { internals, roomObject } = makePreviewer();

        internals.onRoomObjectAdded({ roomId: 77, objectId: RoomPreviewer.PREVIEW_OBJECT_ID, category: RoomObjectCategory.FLOOR });

        expect(roomObject.model.setValue).toHaveBeenCalledWith('furniture_invisible_layer', 1);
    });

    it('centers wall furniture on the configured horizontal preview offset', () =>
    {
        const { internals } = makePreviewer(RoomObjectCategory.WALL);

        internals._centerWallItems = true;
        internals._addViewOffset = new Point(4, 0);
        internals._currentPreviewRectangle = new Rectangle(-22, -100, 40, 200);

        expect(internals.getCanvasOffset(new Point(0, 10))).toEqual(expect.objectContaining({ x: 4, y: 10 }));
    });

    it('keeps the small scale until furniture has enough margin to grow without clipping', () =>
    {
        const { internals, roomEngine } = makePreviewer();

        internals._currentPreviewScale = RoomPreviewer.SCALE_SMALL;
        internals._currentPreviewNeedsZoomOut = false;
        internals._currentPreviewRectangle = new Rectangle(0, 0, 230, 100);

        internals.validatePreviewSize(new Point(0, 0));

        expect(roomEngine.setRoomInstanceRenderingCanvasScale).not.toHaveBeenCalled();
        expect(internals._currentPreviewScale).toBe(RoomPreviewer.SCALE_SMALL);
    });

    it('changes furni state and disables automatic cycling', () =>
    {
        const { previewer, internals, roomEngine } = makePreviewer();

        previewer.changeRoomObjectState();

        expect(internals._automaticStateChange).toBe(false);
        expect(roomEngine.changeObjectState).toHaveBeenCalledWith(77, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);
    });

    it('applies explicit zoom in and out without an automatic-size lock overriding the choice', () =>
    {
        const { previewer, internals, roomEngine } = makePreviewer();

        previewer.zoomOut();
        expect(internals._currentPreviewNeedsZoomOut).toBe(true);
        expect(roomEngine.setRoomInstanceRenderingCanvasScale).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_CANVAS_ID, 0.5);

        previewer.zoomIn();
        expect(internals._currentPreviewNeedsZoomOut).toBe(false);
        expect(roomEngine.setRoomInstanceRenderingCanvasScale).toHaveBeenLastCalledWith(77, RoomPreviewer.PREVIEW_CANVAS_ID, 1);
    });
});

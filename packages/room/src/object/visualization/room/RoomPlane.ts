import { IAssetPlane, IAssetPlaneMaterialCellColumn, IAssetPlaneMaterialCellMatrix, IAssetPlaneVisualization, IAssetPlaneVisualizationAnimatedLayer, IAssetPlaneVisualizationData, IAssetPlaneVisualizationLayer, IAssetRoomVisualizationData, IPlaneDrawingData, IRoomGeometry, IRoomPlane, IVector3D } from '@octane/api';
import { GetAssetManager } from '@octane/assets';
import { BumpTextureContentVersion, GetRenderer, GetTexturePool, OctaneLogger, PlaneMaskFilter, Vector3d } from '@octane/utils';
import { Container, Filter, Graphics, Matrix, Point, Rectangle, RenderTexture, Sprite, Texture, TilingSprite } from 'pixi.js';
import { MAX_ROOM_PLANE_PATCHES } from '../../../renderer/utils/RoomPlaneDisplay';
import { IsRoomPlaneTileOpaque } from '../../../renderer/utils/RoomPlaneHitTest';
import { RoomGeometry } from '../../../utils';
import { IWindowReflectionAvatarState, IWindowReflectionUnitState, RoomWindowReflectionState } from '../RoomWindowReflectionState';
import { PlaneVisualizationAnimationLayer } from './animated';
import { PlaneDrawingData } from './PlaneDrawingData';
import { RoomPlaneBitmapMask } from './RoomPlaneBitmapMask';
import { RoomPlaneDrawData } from './RoomPlaneDrawData';
import { RoomPlaneRectangleMask } from './RoomPlaneRectangleMask';
import { PlaneMaskManager } from './mask';
import { Randomizer } from './utils';

interface IWindowReflectionSnapshot
{
    avatar?: IWindowReflectionAvatarState;
    unit?: IWindowReflectionUnitState;
    location: IVector3D;
}

export class RoomPlane implements IRoomPlane
{
    public static HORIZONTAL_ANGLE_DEFAULT: number = 45;
    public static VERTICAL_ANGLE_DEFAULT: number = 30;
    public static PLANE_GEOMETRY: { [index: number]: IRoomGeometry } = {
        '32': new RoomGeometry(32, new Vector3d(RoomPlane.HORIZONTAL_ANGLE_DEFAULT, RoomPlane.VERTICAL_ANGLE_DEFAULT), new Vector3d(-10, 0, 0)),
        '64': new RoomGeometry(64, new Vector3d(RoomPlane.HORIZONTAL_ANGLE_DEFAULT, RoomPlane.VERTICAL_ANGLE_DEFAULT), new Vector3d(-10, 0, 0))
    };
    private static ANIMATION_UPDATE_INTERVAL: number = 500;
    // room.planes.direct (RoomEngine.setPlaneRenderMode, WebGL2 only): the canvas draws planes straight
    // from their tile (RoomPlaneDisplay) instead of a render texture the size of the plane's bounding box.
    // Only the area around door/window masks, and the landscape behind them, is still baked, as small
    // patches. False is the full-plane bake.
    public static DIRECT_DRAW: boolean = false;
    // Mask art drawn through the skew bleeds into the next pixel with linear filtering.
    private static PATCH_PADDING: number = 2;
    private static EMPTY_CLEAR_CONTAINER: Container = new Container();
    private static LANDSCAPE_DEFAULT_BACKGROUND_COLOR: number = 0x84C6DF;

    public static TYPE_UNDEFINED: number = 0;
    public static TYPE_WALL: number = 1;
    public static TYPE_FLOOR: number = 2;
    public static TYPE_LANDSCAPE: number = 3;
    private static _uniqueIdCounter: number = 1;

    private _disposed: boolean = false;
    private _randomSeed: number;
    private _origin: IVector3D = new Vector3d();
    private _location: IVector3D = new Vector3d();
    private _leftSide: IVector3D = new Vector3d();
    private _rightSide: IVector3D = new Vector3d();
    private _normal: IVector3D = null;
    private _secondaryNormals: IVector3D[] = [];
    private _type: number;
    private _isVisible: boolean = false;
    private _offset: Point = new Point();
    private _relativeDepth: number = 0;
    private _color: number = 0;
    private _maskManager: PlaneMaskManager = null;
    private _id: string = null;
    private _uniqueId: number;
    private _cornerA: IVector3D = new Vector3d();
    private _cornerB: IVector3D = new Vector3d();
    private _cornerC: IVector3D = new Vector3d();
    private _cornerD: IVector3D = new Vector3d();
    private _screenLocation: Point = new Point();
    private _screenAxisX: Point = new Point();
    private _screenAxisY: Point = new Point();
    private _screenAxisZ: Point = new Point();
    private _screenScale: number = 64;
    private _textureOffsetX: number;
    private _textureOffsetY: number;
    private _textureMaxX: number;
    private _textureMaxY: number;
    private _width: number = 0;
    private _height: number = 0;
    private _hasTexture: boolean = true;
    private _canBeVisible: boolean = true;
    private _geometryUpdateId: number = -1;
    private _extraDepth: number = 0;
    private _isHighlighter: boolean = false;

    private _useMask: boolean;
    private _bitmapMasks: RoomPlaneBitmapMask[] = [];
    private _rectangleMasks: RoomPlaneRectangleMask[] = [];
    private _maskChanged: boolean = false;
    private _bitmapMasksOld: RoomPlaneBitmapMask[] = [];
    private _rectangleMasksOld: RoomPlaneRectangleMask[] = [];

    private _planeSprite: TilingSprite = null;
    private _planeTexture: Texture = null;
    private _maskFilter: Filter = null;

    private _animationLayers: PlaneVisualizationAnimationLayer[] = [];
    private _isAnimated: boolean = false;
    private _lastAnimationUpdate: number = 0;
    private _animationRenderTime: number = -1;
    private _animationCanvasWidth: number = 0;
    private _animationCanvasHeight: number = 0;
    private _landscapeRenderWidth: number = 0;
    private _landscapeRenderHeight: number = 0;
    private _landscapeOffsetX: number = 0;
    private _landscapeOffsetY: number = 0;
    private _landscapeBackgroundTexture: Texture = null;
    private _landscapeBackgroundTint: number = 0xffffff;
    private _landscapeForegroundTexture: Texture = null;
    private _landscapeForegroundTint: number = 0xffffff;
    private _landscapeBaseAlignBottom: boolean = false;
    private _landscapeForegroundAlignBottom: boolean = false;
    private _landscapeBackgroundColor: number = null;
    private _lastLandscapeDebugSignature: string = null;
    private _hasWindowMask: boolean = false;
    private _windowMasks: { leftSideLoc: number; rightSideLoc: number }[] = [];
    private _lastWindowReflectionUpdateId: number = -1;
    private _lastWindowReflectionSignature: string = '';
    private _windowReflectionFirstSeenAt: Map<string, number> = new Map();
    private _windowReflectionLastVisible: Map<string, IWindowReflectionSnapshot> = new Map();
    private _windowReflectionFadeOut: Map<string, IWindowReflectionSnapshot & { startedAt: number }> = new Map();
    private _planeBaseTexture: Texture = null;
    private _reflectionFadeAnimating: boolean = false;
    private _reflectionZoneRegistered: boolean = false;
    private _roomId: string = null;
    private _animationCanvas: RenderTexture = null;

    // Direct drawing only.
    private _drawData: RoomPlaneDrawData = null;
    private _planeMatrix: Matrix = null;
    // Per patch: the plane pixels it covers and their baked texels.
    private _patchRects: Rectangle[] = [];
    private _patchSources: RenderTexture[] = [];
    private _patchLayoutId: number = 0;
    // A landscape is only seen through the holes of the wall in front of it, so it bakes just those areas.
    private _occluder: RoomPlane = null;
    private _occluderUsable: boolean = true;
    private _occluderLayoutId: number = -1;

    // Where renderPlaneBase draws: the plane texture (bake) or one patch (direct).
    private _renderTarget: Texture = null;
    private _renderTransform: Matrix = null;

    constructor(origin: IVector3D, location: IVector3D, leftSide: IVector3D, rightSide: IVector3D, type: number, usesMask: boolean, secondaryNormals: IVector3D[], randomSeed: number, textureOffsetX: number = 0, textureOffsetY: number = 0, textureMaxX: number = 0, textureMaxY: number = 0)
    {
        this._randomSeed = randomSeed;
        this._origin.assign(origin);
        this._location.assign(location);
        this._leftSide.assign(leftSide);
        this._rightSide.assign(rightSide);
        this._normal = Vector3d.crossProduct(this._leftSide, this._rightSide);

        if(this._normal.length > 0) this._normal.multiply((1 / this._normal.length));

        if(secondaryNormals != null)
        {
            for(const entry of secondaryNormals)
            {
                if(!entry) continue;

                const vector = new Vector3d();

                vector.assign(entry);

                this._secondaryNormals.push(vector);
            }
        }

        this._type = type;
        this._textureOffsetX = textureOffsetX;
        this._textureOffsetY = textureOffsetY;
        this._textureMaxX = textureMaxX;
        this._textureMaxY = textureMaxY;
        this._useMask = usesMask;
        this._uniqueId = ++RoomPlane._uniqueIdCounter;
    }

    public dispose(): void
    {
        this._location = null;
        this._origin = null;
        this._leftSide = null;
        this._rightSide = null;
        this._normal = null;
        this._cornerA = null;
        this._cornerB = null;
        this._cornerC = null;
        this._cornerD = null;

        if(this._planeSprite) this._planeSprite.destroy();

        if(this._planeTexture)
        {
            GetTexturePool().putTexture(this._planeTexture);

            this._planeTexture = null;
        }

        if(this._planeBaseTexture)
        {
            GetTexturePool().putTexture(this._planeBaseTexture);

            this._planeBaseTexture = null;
        }

        this.setPatchRects([]);
        this._drawData = null;
        this._renderTarget = null;
        this._renderTransform = null;

        if(this._animationLayers)
        {
            for(const layer of this._animationLayers)
            {
                if(layer) layer.dispose();
            }
            this._animationLayers = [];
        }

        if(this._animationCanvas)
        {
            this._animationCanvas.destroy(true);

            this._animationCanvas = null;
        }

        this._windowReflectionLastVisible.clear();
        this._windowReflectionFadeOut.clear();
        this._windowReflectionFirstSeenAt.clear();
        this._lastWindowReflectionSignature = '';

        RoomWindowReflectionState.unregisterZone(this);

        if(this._maskFilter)
        {
            this._maskFilter.destroy();
            this._maskFilter = null;
        }

        this._disposed = true;
    }

    public update(geometry: IRoomGeometry, timeSinceStartMs: number, needsUpdate: boolean = false): boolean
    {
        if(!geometry || this._disposed) return false;

        if(this._geometryUpdateId !== geometry.updateId)
        {
            this._geometryUpdateId = geometry.updateId;

            needsUpdate = true;
        }

        // Direct drawing lets go of the patches of a plane that cannot be seen; canBeVisible rebuilds it.
        if(RoomPlane.DIRECT_DRAW && !this._canBeVisible)
        {
            this.releasePlaneTexture();

            return false;
        }

        const needsAnimationUpdate = this._isAnimated && this._type === RoomPlane.TYPE_LANDSCAPE &&
            (timeSinceStartMs - this._lastAnimationUpdate) >= RoomPlane.ANIMATION_UPDATE_INTERVAL;

        if(!needsUpdate && !needsAnimationUpdate)
        {
            if(!this._canBeVisible || !this.visible) return false;
        }

        if(needsUpdate)
        {
            let cosAngle = 0;

            cosAngle = Vector3d.cosAngle(geometry.directionAxis, this.normal);

            if(cosAngle > -0.001)
            {
                if(this._isVisible)
                {
                    this._isVisible = false;

                    return true;
                }

                return false;
            }

            let i = 0;

            while(i < this._secondaryNormals.length)
            {
                cosAngle = Vector3d.cosAngle(geometry.directionAxis, this._secondaryNormals[i]);

                if(cosAngle > -0.001)
                {
                    if(this._isVisible)
                    {
                        this._isVisible = false;
                        return true;
                    }

                    return false;
                }

                i++;
            }

            this.updateCorners(geometry);

            let relativeDepth = (Math.max(this._cornerA.z, this._cornerB.z, this._cornerC.z, this._cornerD.z) - geometry.getScreenPosition(this._origin).z);

            switch(this._type)
            {
                case RoomPlane.TYPE_FLOOR: {
                    relativeDepth = (relativeDepth - ((this._location.z + Math.min(0, this._leftSide.z, this._rightSide.z)) * 8));
                    break;
                }
                case RoomPlane.TYPE_LANDSCAPE:
                    relativeDepth = (relativeDepth + 0.02);
                    break;
            }

            this._relativeDepth = relativeDepth;
            this._isVisible = true;

            Randomizer.setSeed(this._randomSeed);

            const planeGeometry = RoomPlane.PLANE_GEOMETRY[geometry.scale];
            let width = (this._leftSide.length * geometry.scale);
            let height = (this._rightSide.length * geometry.scale);
            const normal = geometry.getCoordinatePosition(this._normal);

            const getTextureAndColorForPlane = (planeId: string, planeType: number, planeNormal: IVector3D) =>
            {
                const dataType: keyof IAssetRoomVisualizationData = (planeType === RoomPlane.TYPE_FLOOR) ? 'floorData' : (planeType === RoomPlane.TYPE_WALL) ? 'wallData' : 'landscapeData';

                const roomCollection = GetAssetManager().getCollection('room');
                let planeVisualizationData = roomCollection?.data?.roomVisualization?.[dataType];
                let plane = planeVisualizationData?.planes?.find(plane => (plane.id === planeId));
                let assetCollection = roomCollection;

                if(!plane && planeType === RoomPlane.TYPE_LANDSCAPE)
                {
                    const landscapeCollection = GetAssetManager().getCollection('landscape');
                    if(landscapeCollection?.data?.roomVisualization?.landscapeData)
                    {
                        planeVisualizationData = landscapeCollection.data.roomVisualization.landscapeData;
                        plane = planeVisualizationData?.planes?.find(p => (p.id === planeId));
                        if(plane) assetCollection = landscapeCollection;
                    }
                }

                if(!plane && planeType === RoomPlane.TYPE_LANDSCAPE)
                {
                    const roomCollection2 = GetAssetManager().getCollection('room');
                    const defaultPlaneData = roomCollection2?.data?.roomVisualization?.landscapeData;
                    plane = defaultPlaneData?.planes?.find(p => (p.id === 'default'));
                    if(plane)
                    {
                        planeVisualizationData = defaultPlaneData;
                        assetCollection = roomCollection2;
                    }
                }

                const pickVisualizationForScale = <T extends { size?: number }>(list: T[] | null | undefined): T | null =>
                {
                    if(!list || !list.length) return null;

                    const getVisualizationSize = (visualization: T) => (visualization.size ?? planeGeometry.scale);
                    const exact = list.find(visualization => (getVisualizationSize(visualization) === planeGeometry.scale));

                    if(exact) return exact;

                    let nearest = list[0];
                    let nearestDiff = Math.abs(getVisualizationSize(nearest) - planeGeometry.scale);

                    for(const visualization of list)
                    {
                        const diff = Math.abs(getVisualizationSize(visualization) - planeGeometry.scale);

                        if(diff < nearestDiff)
                        {
                            nearest = visualization;
                            nearestDiff = diff;
                        }
                    }

                    return nearest;
                };

                let planeVisualization = null;
                if(dataType === 'landscapeData')
                {
                    planeVisualization = (pickVisualizationForScale(plane?.animatedVisualization) ?? pickVisualizationForScale(plane?.visualizations));
                }
                else
                {
                    planeVisualization = pickVisualizationForScale(plane?.visualizations);
                }

                const layers = planeVisualization?.allLayers ?? [];
                const colorLayer = layers.find(layer => (layer as IAssetPlaneVisualizationLayer)?.color !== undefined) as IAssetPlaneVisualizationLayer;
                const materialLayers = layers.filter(layer => (layer as IAssetPlaneVisualizationLayer)?.materialId) as IAssetPlaneVisualizationLayer[];
                const planeColor = colorLayer?.color;
                const baseMaterialId = materialLayers[0]?.materialId;
                const foregroundMaterialId = materialLayers[1]?.materialId;
                const baseAlignBottom = materialLayers[0]?.align === 'bottom';
                const foregroundAlignBottom = materialLayers[1]?.align === 'bottom';

                const backgroundMaterialId = materialLayers[0]?.materialId;
                const hasDirectBackgroundColor = !!materialLayers[0]?.backgroundColor;
                let backgroundColorStr = materialLayers[0]?.backgroundColor;

                if(!backgroundColorStr && backgroundMaterialId)
                {
                    const findBackgroundColorByMaterial = () =>
                    {
                        for(const candidatePlane of planeVisualizationData?.planes ?? [])
                        {
                            const candidateVisualizations = [
                                ...(candidatePlane.visualizations ?? []),
                                ...(candidatePlane.animatedVisualization ?? [])
                            ];

                            for(const candidateVisualization of candidateVisualizations)
                            {
                                if(candidateVisualization?.size !== (planeVisualization?.size ?? planeGeometry.scale)) continue;

                                const candidateMaterialLayers = (candidateVisualization.allLayers ?? []).filter(layer => (layer as IAssetPlaneVisualizationLayer)?.materialId) as IAssetPlaneVisualizationLayer[];
                                const candidateBackgroundLayer = candidateMaterialLayers[0];

                                if(candidateBackgroundLayer?.materialId !== backgroundMaterialId) continue;

                                if(candidateBackgroundLayer.backgroundColor) return candidateBackgroundLayer.backgroundColor;
                            }
                        }

                        return null;
                    };

                    backgroundColorStr = findBackgroundColorByMaterial();
                }

                let backgroundColor: number = null;
                if(backgroundColorStr)
                {
                    backgroundColor = parseInt(backgroundColorStr.replace('#', ''), 16);
                }

                const backgroundColorSource = hasDirectBackgroundColor ? 'direct' : (backgroundColor !== null ? 'fallback-material' : 'none');

                const selectMaterialMatrixForNormal = (matrices = [], normal = null) =>
                {
                    if(!matrices.length) return null;
                    if(!normal) return matrices[0];

                    const matchesNormal = (matrix) =>
                    {
                        const minX = (matrix.normalMinX !== undefined) ? matrix.normalMinX : -1;
                        const maxX = (matrix.normalMaxX !== undefined) ? matrix.normalMaxX : 1;
                        const minY = (matrix.normalMinY !== undefined) ? matrix.normalMinY : -1;
                        const maxY = (matrix.normalMaxY !== undefined) ? matrix.normalMaxY : 1;

                        return ((normal.x >= minX) && (normal.x <= maxX) && (normal.y >= minY) && (normal.y <= maxY));
                    };

                    return matrices.find(matchesNormal) ?? matrices[0];
                };

                const selectBitmapForNormal = (bitmaps = [], normal = null) =>
                {
                    if(!bitmaps.length) return null;
                    if(!normal) return bitmaps[0];

                    const matchesNormal = (bitmap) =>
                    {
                        const minX = (bitmap.normalMinX !== undefined) ? bitmap.normalMinX : -1;
                        const maxX = (bitmap.normalMaxX !== undefined) ? bitmap.normalMaxX : 1;
                        const minY = (bitmap.normalMinY !== undefined) ? bitmap.normalMinY : -1;
                        const maxY = (bitmap.normalMaxY !== undefined) ? bitmap.normalMaxY : 1;

                        return ((normal.x >= minX) && (normal.x <= maxX) && (normal.y >= minY) && (normal.y <= maxY));
                    };

                    return bitmaps.find(matchesNormal) ?? bitmaps[0];
                };
                const getCollectionTexture = (name: string) =>
                {
                    if(!name || !assetCollection) return null;

                    return assetCollection.getTexture(name) ?? assetCollection.getTexture(`${ assetCollection.name }_${ name }`);
                };

                const resolveTextureForMaterial = (materialId: string) =>
                {
                    if(!materialId || !assetCollection) return null;

                    const planeTextureById = planeVisualizationData?.textures?.find(texture => (texture.id === materialId));
                    const planeMaterial = planeVisualizationData?.materials?.find(material => (material.id === materialId));
                    const planeMaterialMatrix = selectMaterialMatrixForNormal(planeMaterial?.matrices, planeNormal);
                    const planeMaterialTextureId = planeMaterialMatrix?.columns?.[0]?.cells?.[0]?.textureId ?? null;
                    const planeTexture = planeTextureById ?? planeVisualizationData?.textures?.find(texture => (texture.id === planeMaterialTextureId));
                    const planeBitmap = selectBitmapForNormal(planeTexture?.bitmaps, planeNormal);
                    const planeAssetName = planeBitmap?.assetName;

                    if(planeAssetName)
                    {
                        return assetCollection.getAsset(planeAssetName)?.texture ?? getCollectionTexture(planeAssetName);
                    }

                    if(planeMaterialTextureId)
                    {
                        return assetCollection.getAsset(planeMaterialTextureId)?.texture ?? getCollectionTexture(planeMaterialTextureId);
                    }

                    return assetCollection.getAsset(materialId)?.texture ?? getCollectionTexture(materialId);
                };

                const texture = resolveTextureForMaterial(baseMaterialId);
                const foregroundTexture = resolveTextureForMaterial(foregroundMaterialId);

                const animationLayers: PlaneVisualizationAnimationLayer[] = [];
                if(planeType === RoomPlane.TYPE_LANDSCAPE && planeVisualization?.allLayers)
                {
                    const animationAssetCollection = roomCollection;
                    for(const layer of planeVisualization.allLayers)
                    {
                        const animatedLayer = layer as IAssetPlaneVisualizationAnimatedLayer;
                        if(animatedLayer?.items && animatedLayer.items.length > 0)
                        {
                            const animLayer = new PlaneVisualizationAnimationLayer(animatedLayer.items, animationAssetCollection);
                            if(animLayer.hasItems) animationLayers.push(animLayer);
                        }
                    }
                }

                return { texture, foregroundTexture, color: planeColor, baseAlignBottom, foregroundAlignBottom, animationLayers, backgroundColor, backgroundColorSource, visualizationSize: (planeVisualization?.size ?? planeGeometry.scale) };
            };

            const planeData = getTextureAndColorForPlane(this._id, this._type, normal);
            const texture = this._hasTexture ? planeData.texture ?? Texture.WHITE : Texture.WHITE;

            const planeTileScale = ((planeData.visualizationSize > 0) ? (planeGeometry.scale / planeData.visualizationSize) : 1);

            // Direct drawing replaces the tiling sprite and its mask children here instead of leaving them behind.
            if(RoomPlane.DIRECT_DRAW && this._planeSprite) this._planeSprite.destroy({ children: true });

            switch(this._type)
            {
                case RoomPlane.TYPE_FLOOR: {
                    const screenOrigin = planeGeometry.getScreenPoint(new Vector3d(0, 0, 0));
                    const screenHeightPoint = planeGeometry.getScreenPoint(new Vector3d(0, (height / planeGeometry.scale), 0));
                    const screenWidthPoint = planeGeometry.getScreenPoint(new Vector3d((width / planeGeometry.scale), 0, 0));

                    let x = 0;
                    let y = 0;

                    if(screenOrigin && screenHeightPoint && screenWidthPoint)
                    {
                        width = Math.round(Math.abs((screenOrigin.x - screenWidthPoint.x)));
                        height = Math.round(Math.abs((screenOrigin.x - screenHeightPoint.x)));

                        const pixelsPerUnit = (screenOrigin.x - planeGeometry.getScreenPoint(new Vector3d(1, 0, 0)).x);

                        x = (this._textureOffsetX * Math.trunc(Math.abs(pixelsPerUnit)));
                        y = (this._textureOffsetY * Math.trunc(Math.abs(pixelsPerUnit)));
                    }

                    if((x !== 0) || (y !== 0))
                    {
                        while(x < 0) x += texture.width;

                        while(y < 0) y += texture.height;
                    }

                    this._planeSprite = new TilingSprite({
                        texture,
                        width,
                        height,
                        tint: planeData.color,
                        tilePosition: {
                            x: (x % texture.width) + (this._textureOffsetX * texture.width),
                            y: (y % texture.height) + (this._textureOffsetY * texture.height)
                        }
                    });

                    this._planeSprite.tileScale.set(planeTileScale, planeTileScale);

                    break;
                }
                case RoomPlane.TYPE_WALL: {
                    const screenOrigin = planeGeometry.getScreenPoint(new Vector3d(0, 0, 0));
                    const screenHeightPoint = planeGeometry.getScreenPoint(new Vector3d(0, 0, (height / planeGeometry.scale)));
                    const screenWidthPoint = planeGeometry.getScreenPoint(new Vector3d(0, (width / planeGeometry.scale), 0));

                    if(screenOrigin && screenHeightPoint && screenWidthPoint)
                    {
                        width = Math.round(Math.abs((screenOrigin.x - screenWidthPoint.x)));
                        height = Math.round(Math.abs((screenOrigin.y - screenHeightPoint.y)));
                    }

                    this._planeSprite = new TilingSprite({
                        texture,
                        width,
                        height,
                        tint: planeData.color,
                        tilePosition: {
                            x: (this._textureOffsetX * texture.width),
                            y: (this._textureOffsetY * texture.height)
                        }
                    });

                    this._planeSprite.tileScale.set(planeTileScale, planeTileScale);

                    break;
                }
                case RoomPlane.TYPE_LANDSCAPE: {
                    const screenOrigin = planeGeometry.getScreenPoint(new Vector3d(0, 0, 0));
                    const screenDepthPoint = planeGeometry.getScreenPoint(new Vector3d(0, 0, 1));
                    const screenWidthPoint = planeGeometry.getScreenPoint(new Vector3d(0, 1, 0));

                    if(screenOrigin && screenDepthPoint && screenWidthPoint)
                    {
                        width = Math.round(Math.abs((((screenOrigin.x - screenWidthPoint.x) * width) / planeGeometry.scale)));
                        height = Math.round(Math.abs((((screenOrigin.y - screenDepthPoint.y) * height) / planeGeometry.scale)));
                    }

                    const renderMaxX = Math.trunc(this._textureMaxX * Math.abs((screenOrigin.x - screenWidthPoint.x)));
                    const renderMaxY = Math.trunc(this._textureMaxY * Math.abs((screenOrigin.y - screenDepthPoint.y)));
                    const renderOffsetX = Math.trunc(this._textureOffsetX * Math.abs((screenOrigin.x - screenWidthPoint.x)));
                    const renderOffsetY = Math.trunc(this._textureOffsetY * Math.abs((screenOrigin.y - screenDepthPoint.y)));

                    this._landscapeRenderWidth = width;
                    this._landscapeRenderHeight = height;
                    this._animationCanvasWidth = renderMaxX || width;
                    this._animationCanvasHeight = height;
                    this._landscapeOffsetX = renderOffsetX;
                    this._landscapeOffsetY = renderOffsetY;

                    if(this._animationLayers)
                    {
                        for(const layer of this._animationLayers)
                        {
                            if(layer) layer.dispose();
                        }
                    }
                    this._animationLayers = planeData.animationLayers || [];
                    this._isAnimated = this._animationLayers.length > 0;

                    this._landscapeBackgroundTexture = planeData.texture ?? null;
                    this._landscapeBackgroundTint = planeData.color ?? 0xffffff;
                    this._landscapeForegroundTexture = planeData.foregroundTexture ?? null;
                    const landscapeTint = planeData.color ?? this._color ?? 0xffffff;
                    this._landscapeForegroundTint = landscapeTint;
                    this._landscapeBaseAlignBottom = planeData.baseAlignBottom ?? false;
                    this._landscapeForegroundAlignBottom = planeData.foregroundAlignBottom ?? false;
                    this._landscapeBackgroundColor = planeData.backgroundColor ?? null;

                    const landscapeDebugPayload = {
                        planeId: this._id,
                        backgroundColor: this._landscapeBackgroundColor,
                        backgroundColorSource: planeData.backgroundColorSource,
                        backgroundTexture: this._landscapeBackgroundTexture?.label ?? this._landscapeBackgroundTexture?.source?.label ?? null,
                        foregroundTexture: this._landscapeForegroundTexture?.label ?? this._landscapeForegroundTexture?.source?.label ?? null,
                        hasCloudAnimation: this._isAnimated
                    };
                    const landscapeDebugSignature = JSON.stringify(landscapeDebugPayload);

                    if(this._lastLandscapeDebugSignature !== landscapeDebugSignature)
                    {
                        this._lastLandscapeDebugSignature = landscapeDebugSignature;
                    }

                    this._planeSprite = new TilingSprite({
                        texture: Texture.WHITE,
                        width,
                        height,
                        tilePosition: {
                            x: renderOffsetX,
                            y: renderOffsetY
                        },
                        tint: landscapeTint
                    });
                    this._landscapeBackgroundTint = landscapeTint;
                    break;
                }
                default: {
                    this._planeSprite = new TilingSprite({
                        texture: Texture.WHITE,
                        width: width,
                        height: height
                    });
                }
            }

            this._planeSprite.allowChildren = true;
        }

        if(needsUpdate || this._maskChanged)
        {
            this.updateMask(this._planeSprite, geometry);

            needsUpdate = true;
        }

        if(RoomPlane.DIRECT_DRAW) return this.updatePatches(needsUpdate, timeSinceStartMs, geometry);

        if(this._planeTexture)
        {
            if(this._planeTexture.width !== this._width || this._planeTexture.height !== this._height)
            {
                GetTexturePool().putTexture(this._planeTexture);

                this._planeTexture = null;
            }
        }

        if(!this._planeTexture) this._planeTexture = GetTexturePool().getTexture(this._width, this._height);

        this._planeTexture.source.label = `room_plane_${ this._uniqueId.toString() }`;

        const reflectionUpdate = this.checkReflectionUpdate();

        let animationUpdate = false;
        if(this._isAnimated && this._type === RoomPlane.TYPE_LANDSCAPE)
        {
            const timeSinceLastUpdate = timeSinceStartMs - this._lastAnimationUpdate;
            if((timeSinceLastUpdate >= RoomPlane.ANIMATION_UPDATE_INTERVAL) || (this._animationRenderTime < 0))
            {
                animationUpdate = true;
                this._lastAnimationUpdate = timeSinceStartMs;
                this._animationRenderTime = timeSinceStartMs;
            }
            else if(needsUpdate || reflectionUpdate)
            {
                animationUpdate = true;
            }
        }

        const hasReflections = ((this._type === RoomPlane.TYPE_LANDSCAPE) && (this._windowMasks.length > 0));

        let renderBase = (needsUpdate || animationUpdate);

        if(!renderBase && reflectionUpdate && !this.restoreReflectionBase()) renderBase = true;

        if(renderBase)
        {
            this.renderPlaneBase(geometry, timeSinceStartMs);

            if(hasReflections) this.captureReflectionBase();
        }

        if((renderBase || reflectionUpdate) && hasReflections) this.renderWindowReflections();

        return needsUpdate || animationUpdate || reflectionUpdate;
    }

    private checkReflectionUpdate(): boolean
    {
        let reflectionUpdate = false;

        if(this._type === RoomPlane.TYPE_LANDSCAPE && this._windowMasks.length)
        {
            if(!this._reflectionZoneRegistered)
            {
                RoomWindowReflectionState.registerZone(this, this._location, this._normal, this._roomId);

                this._reflectionZoneRegistered = true;
            }

            const reflectionUpdateId = RoomWindowReflectionState.updateId;

            if(reflectionUpdateId !== this._lastWindowReflectionUpdateId)
            {
                this._lastWindowReflectionUpdateId = reflectionUpdateId;

                reflectionUpdate = this.hasWindowReflectionWork();
            }

            if(!reflectionUpdate && this._reflectionFadeAnimating) reflectionUpdate = true;

            if(!reflectionUpdate && this._windowReflectionLastVisible.size && this.hasDriftedReflection()) reflectionUpdate = true;
        }

        return reflectionUpdate;
    }

    // Direct drawing: no plane texture, only the patches (mask areas, landscapes) are baked. Animation and
    // reflection frames redraw the patches in place; the canvas already shows them.
    private updatePatches(needsUpdate: boolean, timeSinceStartMs: number, geometry: IRoomGeometry): boolean
    {
        if(!this._planeSprite) return false;

        let layoutChanged = false;

        if(needsUpdate || (this._occluder && (this._occluder.patchLayoutId !== this._occluderLayoutId)))
        {
            layoutChanged = this.updateDrawData();
            needsUpdate = true;
        }

        const isLandscape = (this._type === RoomPlane.TYPE_LANDSCAPE);
        const hasReflections = (isLandscape && (this._windowMasks.length > 0));
        const reflectionUpdate = this.checkReflectionUpdate();

        let animationUpdate = false;

        if(this._isAnimated && isLandscape && this._patchSources.length)
        {
            if(((timeSinceStartMs - this._lastAnimationUpdate) >= RoomPlane.ANIMATION_UPDATE_INTERVAL) || (this._animationRenderTime < 0))
            {
                animationUpdate = true;
                this._lastAnimationUpdate = timeSinceStartMs;
                this._animationRenderTime = timeSinceStartMs;
            }
            else if(needsUpdate || reflectionUpdate)
            {
                animationUpdate = true;
            }
        }

        if((needsUpdate || animationUpdate || reflectionUpdate) && this._patchSources.length)
        {
            for(let i = 0; i < this._patchSources.length; i++)
            {
                const rect = this._patchRects[i];
                const transform = this._planeMatrix.clone().translate(-(rect.x), -(rect.y));

                this.renderPlaneBase(geometry, timeSinceStartMs, this._patchSources[i], transform);
            }

            if(hasReflections) this.renderWindowReflections();

            // Hit testing caches patch pixels by this version.
            for(const source of this._patchSources) BumpTextureContentVersion(source);
        }

        return (needsUpdate || layoutChanged);
    }

    private updateDrawData(): boolean
    {
        const width = this._width;
        const height = this._height;
        const sprite = this._planeSprite;
        const isLandscape = (this._type === RoomPlane.TYPE_LANDSCAPE);

        this._planeMatrix = this.getPlaneMatrix();

        if(!this._drawData) this._drawData = new RoomPlaneDrawData();

        const data = this._drawData;

        let direct = (!isLandscape && (width > 0) && (height > 0));
        let rects: Rectangle[] = [];

        if((width > 0) && (height > 0))
        {
            if(isLandscape)
            {
                rects = this.getLandscapePatchRects(width, height);
            }
            else if(sprite.children.length)
            {
                rects = this.getMaskPatchRects(width, height);

                if(!rects)
                {
                    direct = false;
                    rects = [ new Rectangle(0, 0, width, height) ];
                }
            }
        }

        data.width = width;
        data.height = height;
        data.direct = direct;
        // updateMask put PlaneMaskFilter on the sprite: the bake turned every pure black pixel transparent.
        data.blackIsTransparent = !!(sprite.filters && sprite.filters.length);

        if(direct) data.setTiling(sprite, this._planeMatrix);

        const layoutChanged = this.setPatchRects(rects);

        data.patches = this._patchRects.map((rect, index) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, texture: this._patchSources[index] }));
        data.version++;

        return layoutChanged;
    }

    // The bake's pixels differ from the plain tiling only under the mask sprites; each one's bounds, through
    // the plane matrix, become a patch. Null when there are too many to cut out: the whole plane is baked.
    private getMaskPatchRects(width: number, height: number): Rectangle[]
    {
        const matrix = new Matrix();
        const point = new Point();
        const rects: Rectangle[] = [];
        const padding = RoomPlane.PATCH_PADDING;

        for(const child of this._planeSprite.children)
        {
            if(!(child instanceof Sprite) || !child.texture) continue;

            child.updateLocalTransform();

            matrix.copyFrom(this._planeMatrix).append(child.localTransform);

            const orig = child.texture.orig;

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for(const [ x, y ] of [ [ 0, 0 ], [ orig.width, 0 ], [ orig.width, orig.height ], [ 0, orig.height ] ])
            {
                matrix.apply(point.set(x, y), point);

                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }

            const left = Math.max(0, (Math.floor(minX) - padding));
            const top = Math.max(0, (Math.floor(minY) - padding));
            const right = Math.min(width, (Math.ceil(maxX) + padding));
            const bottom = Math.min(height, (Math.ceil(maxY) + padding));

            if((right <= left) || (bottom <= top)) continue;

            rects.push(new Rectangle(left, top, (right - left), (bottom - top)));
        }

        return RoomPlane.mergePatchRects(rects);
    }

    // Overlapping or touching patches become one: the shader reads at most MAX_ROOM_PLANE_PATCHES. Null past that.
    public static mergePatchRects(rects: Rectangle[]): Rectangle[]
    {
        let merged = true;

        while(merged)
        {
            merged = false;

            for(let i = 0; (i < rects.length) && !merged; i++)
            {
                for(let j = (i + 1); j < rects.length; j++)
                {
                    const a = rects[i];
                    const b = rects[j];

                    if((a.x > b.right) || (b.x > a.right) || (a.y > b.bottom) || (b.y > a.bottom)) continue;

                    const left = Math.min(a.x, b.x);
                    const top = Math.min(a.y, b.y);

                    rects[i] = new Rectangle(left, top, (Math.max(a.right, b.right) - left), (Math.max(a.bottom, b.bottom) - top));
                    rects.splice(j, 1);

                    merged = true;

                    break;
                }
            }
        }

        if(rects.length > MAX_ROOM_PLANE_PATCHES) return null;

        return rects;
    }

    // Behind an opaque wall only the wall's own patches can show the landscape. Anything else (walls
    // hidden, a see-through wall tile, a wall baked whole) bakes the landscape whole.
    private getLandscapePatchRects(width: number, height: number): Rectangle[]
    {
        const occluder = this._occluder;

        this._occluderLayoutId = (occluder ? occluder.patchLayoutId : -1);

        if(occluder && this._occluderUsable && occluder.coversLandscape(width, height)) return occluder.patchRects.map(rect => rect.clone());

        return [ new Rectangle(0, 0, width, height) ];
    }

    private coversLandscape(width: number, height: number): boolean
    {
        const data = this._drawData;

        if(!this.visible || !data || !data.direct) return false;

        if((this._width !== width) || (this._height !== height)) return false;

        return IsRoomPlaneTileOpaque(data);
    }

    // Returns true when the patch layout changed (textures were replaced).
    private setPatchRects(rects: Rectangle[]): boolean
    {
        const sameRect = (a: Rectangle, b: Rectangle) => ((a.x === b.x) && (a.y === b.y) && (a.width === b.width) && (a.height === b.height));

        if((rects.length === this._patchRects.length) && rects.every((rect, index) => sameRect(rect, this._patchRects[index]))) return false;

        // Deferred a frame: a canvas display may still read them until it picks up the new draw data.
        for(const source of this._patchSources) GetTexturePool().releaseTexture(source, true);

        this._patchRects = rects;
        this._patchSources = rects.map((rect, index) =>
        {
            const source = RenderTexture.create({ width: rect.width, height: rect.height });

            source.source.label = `room_plane_${ this._uniqueId }_${ index }`;

            return source;
        });

        this._patchLayoutId++;

        return true;
    }

    private getPlaneMatrix(): Matrix
    {
        if(this._type === RoomPlane.TYPE_LANDSCAPE) return this.getMatrixForDimensions(this._landscapeRenderWidth, this._landscapeRenderHeight);

        return this.getMatrixForDimensions(this._planeSprite.width, this._planeSprite.height);
    }

    private releasePlaneTexture(): void
    {
        if(this._planeTexture)
        {
            GetTexturePool().putTexture(this._planeTexture);

            this._planeTexture = null;
        }

        if(this._patchRects.length)
        {
            this.setPatchRects([]);

            if(this._drawData)
            {
                this._drawData.patches = [];
                this._drawData.version++;
            }
        }
    }

    // Bake: into the plane texture through the plane's skew. Direct: into one patch, through the plane's
    // skew moved to that patch's corner.
    private renderPlaneBase(geometry: IRoomGeometry, timeSinceStartMs: number, target: Texture = this._planeTexture, transform: Matrix = null): void
    {
        this._renderTarget = target;
        this._renderTransform = transform;

        const isLandscape = (this._type === RoomPlane.TYPE_LANDSCAPE);
        const hasLandscapeLayeredRendering = (isLandscape && (this._landscapeBackgroundTexture !== null || this._landscapeForegroundTexture !== null || this._animationLayers.length > 0 || this._landscapeBackgroundColor !== null));

        if(hasLandscapeLayeredRendering)
        {
            if(this._landscapeBackgroundColor !== null)
            {
                this.renderBackgroundColor();
            }
            else
            {
                this.clearPlaneTexture();
            }
        }
        else
        {
            GetRenderer().render({
                target: this._renderTarget,
                container: this._planeSprite,
                transform: (this._renderTransform ?? this.getMatrixForDimensions(this._planeSprite.width, this._planeSprite.height)),
                clear: true
            });
        }

        if(isLandscape && this._landscapeBackgroundTexture)
        {
            this.renderLandscapeLayer(this._landscapeBackgroundTexture, this._landscapeBackgroundTint, this._landscapeBaseAlignBottom);
        }

        if(this._isAnimated && isLandscape && this._animationLayers.length > 0)
        {
            this.renderAnimationLayers(((this._animationRenderTime >= 0) ? this._animationRenderTime : timeSinceStartMs), geometry);
        }

        if(isLandscape && this._landscapeForegroundTexture)
        {
            this.renderLandscapeLayer(this._landscapeForegroundTexture, this._landscapeForegroundTint, this._landscapeForegroundAlignBottom);
        }
    }

    private captureReflectionBase(): void
    {
        if(!this._planeTexture) return;

        if(this._planeBaseTexture && ((this._planeBaseTexture.width !== this._planeTexture.width) || (this._planeBaseTexture.height !== this._planeTexture.height)))
        {
            GetTexturePool().putTexture(this._planeBaseTexture);

            this._planeBaseTexture = null;
        }

        if(!this._planeBaseTexture) this._planeBaseTexture = GetTexturePool().getTexture(this._planeTexture.width, this._planeTexture.height);

        const copy = new Sprite(this._planeTexture);

        GetRenderer().render({
            target: this._planeBaseTexture,
            container: copy,
            clear: true
        });

        copy.destroy();
    }

    private restoreReflectionBase(): boolean
    {
        if(!this._planeTexture || !this._planeBaseTexture) return false;

        if((this._planeBaseTexture.width !== this._planeTexture.width) || (this._planeBaseTexture.height !== this._planeTexture.height)) return false;

        const copy = new Sprite(this._planeBaseTexture);

        GetRenderer().render({
            target: this._planeTexture,
            container: copy,
            clear: true
        });

        copy.destroy();

        return true;
    }

    private renderAnimationLayers(timeSinceStartMs: number, geometry: IRoomGeometry): void
    {
        if(!this._renderTarget || this._animationCanvasWidth <= 0 || this._animationCanvasHeight <= 0) return;

        const canvasWidth = this._landscapeRenderWidth;
        const canvasHeight = this._landscapeRenderHeight;

        if(canvasWidth <= 0 || canvasHeight <= 0) return;

        if(this._animationCanvas && ((this._animationCanvas.width !== canvasWidth) || (this._animationCanvas.height !== canvasHeight)))
        {
            this._animationCanvas.destroy(true);

            this._animationCanvas = null;
        }

        if(!this._animationCanvas) this._animationCanvas = RenderTexture.create({ width: canvasWidth, height: canvasHeight, scaleMode: 'nearest' });

        const animationCanvas = this._animationCanvas;

        GetRenderer().render({
            target: animationCanvas,
            container: RoomPlane.EMPTY_CLEAR_CONTAINER,
            clear: true
        });

        for(const layer of this._animationLayers)
        {
            if(!layer) continue;

            layer.render(
                animationCanvas,
                this._landscapeOffsetX,
                this._landscapeOffsetY,
                this._animationCanvasWidth,
                this._animationCanvasHeight,
                this._textureMaxX,
                this._textureMaxY,
                timeSinceStartMs
            );
        }

        const animContainer = new Container();
        const animSprite = new Sprite(animationCanvas);
        animContainer.addChild(animSprite);

        if(this._maskFilter)
        {
            animContainer.filters = [this._maskFilter];
        }

        if(this._planeSprite && this._planeSprite.children)
        {
            for(const child of this._planeSprite.children)
            {
                if(child instanceof Sprite)
                {
                    const maskClone = new Sprite(child.texture);
                    maskClone.position.copyFrom(child.position);
                    maskClone.scale.copyFrom(child.scale);
                    animContainer.addChild(maskClone);
                }
            }
        }

        const transform = (this._renderTransform ?? this.getMatrixForDimensions(canvasWidth, canvasHeight));

        GetRenderer().render({
            target: this._renderTarget,
            container: animContainer,
            transform,
            clear: false
        });

        animContainer.destroy({ children: true });
    }

    private renderLandscapeLayer(texture: Texture, tint: number, alignBottom: boolean): void
    {
        if(!this._renderTarget || !texture) return;

        const canvasWidth = this._landscapeRenderWidth;
        const canvasHeight = this._landscapeRenderHeight;

        if(canvasWidth <= 0 || canvasHeight <= 0) return;

        const layerHeight = Math.min(texture.height, canvasHeight);
        const layerPositionY = alignBottom ? (canvasHeight - layerHeight) : 0;
        const verticalCropOffset = (alignBottom && texture.height > layerHeight)
            ? (texture.height - layerHeight)
            : 0;

        const layerSprite = new TilingSprite({
            texture,
            width: canvasWidth,
            height: layerHeight,
            tilePosition: {
                x: this._landscapeOffsetX,
                y: this._landscapeOffsetY - verticalCropOffset
            },
            tint
        });
        layerSprite.y = layerPositionY;

        const layerContainer = new Container();
        layerContainer.addChild(layerSprite);

        if(this._maskFilter)
        {
            layerContainer.filters = [this._maskFilter];
        }

        if(this._planeSprite && this._planeSprite.children)
        {
            for(const child of this._planeSprite.children)
            {
                if(child instanceof Sprite)
                {
                    const maskClone = new Sprite(child.texture);
                    maskClone.position.copyFrom(child.position);
                    maskClone.scale.copyFrom(child.scale);
                    layerContainer.addChild(maskClone);
                }
            }
        }

        const transform = (this._renderTransform ?? this.getMatrixForDimensions(canvasWidth, canvasHeight));

        GetRenderer().render({
            target: this._renderTarget,
            container: layerContainer,
            transform,
            clear: false
        });

        layerContainer.destroy({ children: true });
    }

    private applyPlaneSpriteMasksTo(container: Container): void
    {
        if(!this._planeSprite || !this._planeSprite.children) return;

        for(const child of this._planeSprite.children)
        {
            if(child instanceof Sprite)
            {
                const maskClone = new Sprite(child.texture);
                maskClone.position.copyFrom(child.position);
                maskClone.scale.copyFrom(child.scale);
                container.addChild(maskClone);
            }
        }

        if(this._maskFilter && (container.children.length > 1)) container.filters = [this._maskFilter];
    }

    private renderBackgroundColor(): void
    {
        if(!this._renderTarget || this._landscapeBackgroundColor === null) return;

        const canvasWidth = this._landscapeRenderWidth;
        const canvasHeight = this._landscapeRenderHeight;

        if(canvasWidth <= 0 || canvasHeight <= 0) return;

        const colorGraphics = new Graphics();
        colorGraphics.rect(0, 0, canvasWidth, canvasHeight);
        colorGraphics.fill(this._landscapeBackgroundColor);

        const colorContainer = new Container();
        colorContainer.addChild(colorGraphics);

        this.applyPlaneSpriteMasksTo(colorContainer);

        const transform = (this._renderTransform ?? this.getMatrixForDimensions(canvasWidth, canvasHeight));

        GetRenderer().render({
            target: this._renderTarget,
            container: colorContainer,
            transform,
            clear: true
        });

        colorContainer.destroy({ children: true });
    }

    private clearPlaneTexture(): void
    {
        if(!this._renderTarget) return;

        const canvasWidth = this._landscapeRenderWidth;
        const canvasHeight = this._landscapeRenderHeight;

        if(canvasWidth <= 0 || canvasHeight <= 0)
        {
            const emptyContainer = new Container();

            GetRenderer().render({
                target: this._renderTarget,
                container: emptyContainer,
                clear: true
            });

            emptyContainer.destroy();

            return;
        }

        const colorGraphics = new Graphics();
        colorGraphics.rect(0, 0, canvasWidth, canvasHeight);
        colorGraphics.fill(RoomPlane.LANDSCAPE_DEFAULT_BACKGROUND_COLOR);

        const colorContainer = new Container();
        colorContainer.addChild(colorGraphics);

        this.applyPlaneSpriteMasksTo(colorContainer);

        const transform = (this._renderTransform ?? this.getMatrixForDimensions(canvasWidth, canvasHeight));

        GetRenderer().render({
            target: this._renderTarget,
            container: colorContainer,
            transform,
            clear: true
        });

        colorContainer.destroy({ children: true });
    }

    private hasWindowReflectionWork(): boolean
    {
        if(!this._leftSide || !this._rightSide || !this._normal) return false;

        const signature = RoomWindowReflectionState.getSignatureNear(this._location, this._normal, this._roomId, 1.1);

        if(signature === this._lastWindowReflectionSignature) return false;

        this._lastWindowReflectionSignature = signature;

        return true;
    }

    private hasDriftedReflection(): boolean
    {
        for(const [key, last] of this._windowReflectionLastVisible)
        {
            const id = parseInt(key.substring(1));

            const live = (key.charCodeAt(0) === 117) // 'u'
                ? RoomWindowReflectionState.getUnit(id, this._roomId)?.location
                : RoomWindowReflectionState.getAvatarLocation(id, this._roomId);

            if(!live) return true;

            if((live.x !== last.location.x) || (live.y !== last.location.y) || (live.z !== last.location.z)) return true;
        }

        return false;
    }

    private renderWindowReflections(): void
    {
        this._reflectionFadeAnimating = false;

        const direct = RoomPlane.DIRECT_DRAW;

        if((direct ? !this._patchSources.length : !this._planeTexture) || !this._leftSide || !this._rightSide || !this._normal) return;

        if(this._leftSide.length <= 0 || this._rightSide.length <= 0) return;

        const now = Date.now();
        const fadeDurationMs = 150;
        const avatars = RoomWindowReflectionState.getAvatars(this._roomId);
        const units = RoomWindowReflectionState.getUnits(this._roomId);
        const canvasWidth = this._landscapeRenderWidth;
        const canvasHeight = this._landscapeRenderHeight;

        if(canvasWidth <= 0 || canvasHeight <= 0) return;

        const projection = this.getMatrixForDimensions(canvasWidth, canvasHeight);
        const projectionInverse = projection.clone().invert();
        const debugEnabled = (typeof window !== 'undefined' && (window as unknown as { OctaneReflectionDebug?: boolean }).OctaneReflectionDebug === true);

        const normal2DLength = Math.hypot(this._normal.x, this._normal.y);
        const normalX = ((normal2DLength > 0.0001) ? (this._normal.x / normal2DLength) : 0);
        const normalY = ((normal2DLength > 0.0001) ? (this._normal.y / normal2DLength) : 0);

        const holeRects: { x: number; y: number; w: number; h: number }[] = [];

        if(this._planeSprite?.children)
        {
            for(const child of this._planeSprite.children)
            {
                if(!(child instanceof Sprite) || !child.texture) continue;

                const scaleX = (child.scale?.x ?? 1);
                const scaleY = (child.scale?.y ?? 1);
                const w = Math.abs(child.texture.width * scaleX);
                const h = Math.abs(child.texture.height * scaleY);

                if((w <= 0) || (h <= 0)) continue;

                holeRects.push({
                    x: ((scaleX < 0) ? (child.position.x - w) : child.position.x),
                    y: ((scaleY < 0) ? (child.position.y - h) : child.position.y),
                    w,
                    h
                });
            }
        }

        const subtractHole = (rects: { x: number; y: number; w: number; h: number }[], hole: { x: number; y: number; w: number; h: number }) =>
        {
            const out: { x: number; y: number; w: number; h: number }[] = [];

            for(const r of rects)
            {
                const ix1 = Math.max(r.x, hole.x);
                const iy1 = Math.max(r.y, hole.y);
                const ix2 = Math.min((r.x + r.w), (hole.x + hole.w));
                const iy2 = Math.min((r.y + r.h), (hole.y + hole.h));

                if((ix1 >= ix2) || (iy1 >= iy2))
                {
                    out.push(r);
                    continue;
                }

                if(iy1 > r.y) out.push({ x: r.x, y: r.y, w: r.w, h: (iy1 - r.y) });
                if(iy2 < (r.y + r.h)) out.push({ x: r.x, y: iy2, w: r.w, h: ((r.y + r.h) - iy2) });
                if(ix1 > r.x) out.push({ x: r.x, y: iy1, w: (ix1 - r.x), h: (iy2 - iy1) });
                if(ix2 < (r.x + r.w)) out.push({ x: ix2, y: iy1, w: ((r.x + r.w) - ix2), h: (iy2 - iy1) });
            }

            return out;
        };

        const container = new Container();
        let subjectParent: Container = container;

        if(holeRects.length)
        {
            let rects = [{ x: 0, y: 0, w: canvasWidth, h: canvasHeight }];

            for(const hole of holeRects)
            {
                rects = subtractHole(rects, hole);

                if(!rects.length) break;
            }

            if(!rects.length)
            {
                container.destroy({ children: true });

                return;
            }

            const clip = new Graphics();

            for(const rect of rects) clip.rect(rect.x, rect.y, rect.w, rect.h);

            clip.fill(0xFFFFFF);

            const wrap = new Container();

            wrap.addChild(clip);
            wrap.mask = clip;
            container.addChild(wrap);

            subjectParent = wrap;
        }

        const place = (location: IVector3D, maxDistance: number, verticalOffset: number, attenuate: boolean, label: string, positionLocation: IVector3D = null, depthTiles: number = 0): { screenSpot: Point; planeDistance: number; edgeAlpha: number } =>
        {
            const relative = Vector3d.dif(location, this._location);
            const signedDistance = Vector3d.scalarProjection(relative, this._normal);
            const planeDistance = Math.abs(signedDistance);

            if(planeDistance > maxDistance)
            {
                if(debugEnabled) OctaneLogger.log(`[Reflection] plane ${this._uniqueId}: ${label} at (${location.x}, ${location.y}) rejected — planeDist ${planeDistance.toFixed(2)} > ${maxDistance}`);

                return null;
            }

            const leftSideLoc = Vector3d.scalarProjection(relative, this._leftSide);
            const rightSideLoc = Vector3d.scalarProjection(relative, this._rightSide);

            let closestMask: { leftSideLoc: number; rightSideLoc: number } = null;
            let closestScore = Number.POSITIVE_INFINITY;

            for(const mask of this._windowMasks)
            {
                const score = (Math.abs(mask.leftSideLoc - leftSideLoc) + Math.abs(mask.rightSideLoc - rightSideLoc));

                if(score < closestScore)
                {
                    closestScore = score;
                    closestMask = mask;
                }
            }

            if(!closestMask || (closestScore > 3))
            {
                if(debugEnabled) OctaneLogger.log(`[Reflection] plane ${this._uniqueId}: ${label} at (${location.x}, ${location.y}) rejected — mask score ${closestScore.toFixed(2)} (masks ${JSON.stringify(this._windowMasks)})`);

                return null;
            }

            const normalLength = this._normal.length;
            const unitNormalX = ((normalLength > 0) ? (this._normal.x / normalLength) : 0);
            const unitNormalY = ((normalLength > 0) ? (this._normal.y / normalLength) : 0);
            const unitNormalZ = ((normalLength > 0) ? (this._normal.z / normalLength) : 0);
            const positionRelative = (positionLocation ? Vector3d.dif(positionLocation, this._location) : relative);
            const positionDistance = Vector3d.scalarProjection(positionRelative, this._normal);
            const inward = ((signedDistance >= 0) ? 1 : -1);
            const shift = ((2 * positionDistance) + (inward * depthTiles));
            const mirroredX = (positionRelative.x - (shift * unitNormalX));
            const mirroredY = (positionRelative.y - (shift * unitNormalY));
            const mirroredZ = (positionRelative.z - (shift * unitNormalZ));
            const screenSpot = new Point(
                (this._screenLocation.x + (mirroredX * this._screenAxisX.x) + (mirroredY * this._screenAxisY.x) + (mirroredZ * this._screenAxisZ.x)),
                (this._screenLocation.y + (mirroredX * this._screenAxisX.y) + (mirroredY * this._screenAxisY.y) + (mirroredZ * this._screenAxisZ.y) + verticalOffset));

            const edgeAlpha = (attenuate ? Math.max(0, Math.min(1, ((maxDistance - planeDistance) / 0.25))) : 1);

            if(debugEnabled) OctaneLogger.log(`[Reflection] plane ${this._uniqueId}: ${label} at (${location.x}, ${location.y}) DRAWN — planeDist ${planeDistance.toFixed(2)}, maskScore ${closestScore.toFixed(2)}, leftSideLoc ${leftSideLoc.toFixed(2)}, mirrored to (${(this._location.x + mirroredX).toFixed(2)}, ${(this._location.y + mirroredY).toFixed(2)}, ${(this._location.z + mirroredZ).toFixed(2)}) screen (${screenSpot.x.toFixed(1)}, ${screenSpot.y.toFixed(1)}), edgeAlpha ${edgeAlpha.toFixed(2)}`);

            return { screenSpot, planeDistance, edgeAlpha };
        };

        const drawAvatar = (avatar: IWindowReflectionAvatarState, alpha: number): boolean =>
        {
            if(!avatar?.location || (alpha < 0)) return false;

            const placement = place(avatar.location, 0.8, (avatar.verticalOffset || 0), true, `avatar ${avatar.id}`);

            if(!placement) return false;

            const mirrorDirection = RoomWindowReflectionState.reflectDirection(avatar.direction, normalX, normalY);
            const texture = (avatar.mirrors?.get(mirrorDirection) || avatar.texture);

            if(debugEnabled) OctaneLogger.log(`[Reflection] plane ${this._uniqueId}: avatar ${avatar.id} facing ${avatar.direction}° -> mirror ${mirrorDirection}° ${avatar.mirrors?.has(mirrorDirection) ? 'HIT' : 'MISS (live texture)'} available=[${Array.from(avatar.mirrors?.keys() || []).join(',')}]`);

            if(!texture?.source || texture.source.destroyed || !texture.source.style) return false;

            const footY = (placement.screenSpot.y + (this._screenScale / 4));
            const sprite = new Sprite(texture);

            sprite.anchor.set(0.5, 1);
            sprite.setFromMatrix(projectionInverse.clone().append(new Matrix(1, 0, 0, 1, Math.trunc(placement.screenSpot.x), Math.trunc(footY))));
            sprite.tint = 0xCFE3FF;
            sprite.alpha = (alpha * placement.edgeAlpha);

            subjectParent.addChild(sprite);

            return true;
        };

        const drawUnit = (unit: IWindowReflectionUnitState, alpha: number): boolean =>
        {
            if(!unit?.location || (alpha < 0)) return false;

            const mirrorDirection = RoomWindowReflectionState.reflectDirection(unit.direction, normalX, normalY);
            const layers = (unit.layersByDirection?.get(mirrorDirection) || unit.layers);

            if(debugEnabled) OctaneLogger.log(`[Reflection] plane ${this._uniqueId}: unit ${unit.id} facing ${unit.direction}° -> mirror ${mirrorDirection}° ${unit.layersByDirection?.has(mirrorDirection) ? 'HIT' : 'MISS (live layers)'} available=[${Array.from(unit.layersByDirection?.keys() || []).join(',')}]`);

            if(!layers?.length) return false;

            const sizeAlongNormal = ((Math.abs(normalX) * (unit.sizeX || 1)) + (Math.abs(normalY) * (unit.sizeY || 1)));
            const depthTiles = Math.max(0, (sizeAlongNormal - 1));
            const placement = place(unit.location, 1.1, 0, false, `unit ${unit.id}`, unit.origin, depthTiles);

            if(!placement) return false;

            const originX = placement.screenSpot.x;
            const originY = placement.screenSpot.y;

            let added = false;

            for(const layer of layers)
            {
                if(!layer?.texture?.source || layer.texture.source.destroyed || !layer.texture.source.style) continue;

                const width = layer.texture.width;
                const screenX = (layer.flipH ? (originX + layer.offsetX + width) : (originX + layer.offsetX));
                const screenY = (originY + layer.offsetY);
                const screenMatrix = new Matrix((layer.flipH ? -1 : 1), 0, 0, 1, Math.trunc(screenX), Math.trunc(screenY));
                const sprite = new Sprite(layer.texture);

                sprite.setFromMatrix(projectionInverse.clone().append(screenMatrix));
                sprite.tint = 0xCFE3FF;
                sprite.alpha = (alpha * layer.alpha * placement.edgeAlpha);

                subjectParent.addChild(sprite);

                added = true;
            }

            return added;
        };

        const planeDistanceOf = (location: IVector3D): number =>
        {
            const relative = Vector3d.dif(location, this._location);

            return Math.abs(Vector3d.scalarProjection(relative, this._normal));
        };

        const freeze = (location: IVector3D): IVector3D =>
        {
            const stored = new Vector3d();

            stored.assign(location);

            return stored;
        };

        const drawOrder: { unit?: IWindowReflectionUnitState; avatar?: IWindowReflectionAvatarState; distance: number }[] = [];

        for(const unit of units)
        {
            if(!unit?.location || !unit.layers?.length) continue;

            drawOrder.push({ unit, distance: planeDistanceOf(unit.location) });
        }

        for(const avatar of avatars)
        {
            if(!avatar?.texture?.source || avatar.texture.source.destroyed || !avatar.texture.source.style || !avatar.location) continue;

            drawOrder.push({ avatar, distance: planeDistanceOf(avatar.location) });
        }

        drawOrder.sort((a, b) =>
        {
            const byDistance = (b.distance - a.distance);

            if(Math.abs(byDistance) > 0.25) return byDistance;

            return ((a.avatar ? 1 : -1) - (b.avatar ? 1 : -1));
        });

        const visibleIds = new Set<string>();

        for(const entry of drawOrder)
        {
            const key = (entry.unit ? ('u' + entry.unit.id) : ('a' + entry.avatar.id));
            const isAvatar = !!entry.avatar;

            let firstSeenAt = this._windowReflectionFirstSeenAt.get(key);

            if(firstSeenAt === undefined)
            {
                firstSeenAt = ((isAvatar || this._windowReflectionFadeOut.has(key)) ? (now - fadeDurationMs) : now);
            }

            const elapsed = Math.min(fadeDurationMs, Math.max(0, (now - firstSeenAt)));
            const alpha = (0.4 * (elapsed / fadeDurationMs));
            const drawn = (entry.unit ? drawUnit(entry.unit, alpha) : drawAvatar(entry.avatar, alpha));

            if(!drawn) continue;

            if(!this._windowReflectionFirstSeenAt.has(key)) this._windowReflectionFirstSeenAt.set(key, firstSeenAt);

            if(elapsed < fadeDurationMs) this._reflectionFadeAnimating = true;

            visibleIds.add(key);
            this._windowReflectionFadeOut.delete(key);

            const location = freeze(entry.unit ? entry.unit.location : entry.avatar.location);

            this._windowReflectionLastVisible.set(key, entry.unit
                ? { unit: { ...entry.unit, location }, location }
                : { avatar: { ...entry.avatar, location }, location });
        }

        for(const [id, lastVisible] of this._windowReflectionLastVisible)
        {
            if(visibleIds.has(id) || this._windowReflectionFadeOut.has(id)) continue;

            this._windowReflectionFadeOut.set(id, { ...lastVisible, startedAt: now });
            this._windowReflectionLastVisible.delete(id);
            this._windowReflectionFirstSeenAt.delete(id);
        }

        for(const [id, fadeOut] of this._windowReflectionFadeOut)
        {
            const elapsed = (now - fadeOut.startedAt);

            if(elapsed >= fadeDurationMs)
            {
                this._windowReflectionFadeOut.delete(id);
                continue;
            }

            const alpha = (0.4 * (1 - (elapsed / fadeDurationMs)));
            const rendered = (fadeOut.unit ? drawUnit(fadeOut.unit, alpha) : drawAvatar(fadeOut.avatar, alpha));

            if(!rendered) this._windowReflectionFadeOut.delete(id);
            else this._reflectionFadeAnimating = true;
        }

        if(!container.children.length || (subjectParent !== container && subjectParent.children.length <= 1))
        {
            container.destroy({ children: true });

            if(!avatars.length && !units.length)
            {
                this._windowReflectionFirstSeenAt.clear();
                this._windowReflectionLastVisible.clear();
            }

            return;
        }

        if(direct)
        {
            for(let i = 0; i < this._patchSources.length; i++)
            {
                const rect = this._patchRects[i];

                GetRenderer().render({
                    target: this._patchSources[i],
                    container,
                    transform: projection.clone().translate(-(rect.x), -(rect.y)),
                    clear: false
                });
            }
        }
        else
        {
            GetRenderer().render({
                target: this._planeTexture,
                container,
                transform: projection,
                clear: false
            });
        }

        container.destroy({ children: true });
    }

    // AIR RoomPlane.blend: Canvas.colorize(layerColor, planeColor | 0xFF000000) & 0xFFFFFF.
    public static blendColor(planeColor: number, layerColor: number): number
    {
        const multiplier = ((planeColor | 0xFF000000) >>> 0);

        if(multiplier === 0xFFFFFFFF) return ((layerColor >>> 0) & 0xFFFFFF);

        const red = Math.trunc((((layerColor >> 16) & 0xFF) * ((multiplier >> 16) & 0xFF)) / 255);
        const green = Math.trunc((((layerColor >> 8) & 0xFF) * ((multiplier >> 8) & 0xFF)) / 255);
        const blue = Math.trunc(((layerColor & 0xFF) * (multiplier & 0xFF)) / 255);

        return (((red << 16) | (green << 8) | blue) & 0xFFFFFF);
    }

    private static matchesNormal(item: { normalMinX?: number, normalMaxX?: number, normalMinY?: number, normalMaxY?: number }, normal: IVector3D): boolean
    {
        const minX = (item.normalMinX !== undefined) ? item.normalMinX : -1;
        const maxX = (item.normalMaxX !== undefined) ? item.normalMaxX : 1;
        const minY = (item.normalMinY !== undefined) ? item.normalMinY : -1;
        const maxY = (item.normalMaxY !== undefined) ? item.normalMaxY : 1;

        return ((normal.x >= minX) && (normal.x <= maxX) && (normal.y >= minY) && (normal.y <= maxY));
    }

    // The plane visualization the rasterizer draws for this plane id and scale; AIR PlaneRasterizer.getLayers falls back to "default".
    private getDrawingVisualization(scale: number): { data: IAssetPlaneVisualizationData, visualization: IAssetPlaneVisualization }
    {
        const dataType: keyof IAssetRoomVisualizationData = (this._type === RoomPlane.TYPE_FLOOR) ? 'floorData' : (this._type === RoomPlane.TYPE_WALL) ? 'wallData' : 'landscapeData';
        const candidates: IAssetPlaneVisualizationData[] = [];
        const roomData = GetAssetManager().getCollection('room')?.data?.roomVisualization?.[dataType];

        if(roomData) candidates.push(roomData);

        if(this._type === RoomPlane.TYPE_LANDSCAPE)
        {
            const landscapeData = GetAssetManager().getCollection('landscape')?.data?.roomVisualization?.landscapeData;

            if(landscapeData) candidates.push(landscapeData);
        }

        let data: IAssetPlaneVisualizationData = null;
        let plane: IAssetPlane = null;

        for(const candidate of candidates)
        {
            plane = candidate.planes?.find(entry => (entry.id === this._id)) ?? null;

            if(plane)
            {
                data = candidate;
                break;
            }
        }

        if(!plane && roomData)
        {
            data = roomData;
            plane = roomData.planes?.find(entry => (entry.id === 'default')) ?? null;
        }

        if(!plane) return { data, visualization: null };

        const pick = (list: IAssetPlaneVisualization[]): IAssetPlaneVisualization =>
        {
            if(!list || !list.length) return null;

            const sizeOf = (entry: IAssetPlaneVisualization) => (entry.size ?? scale);

            let nearest = list[0];

            for(const entry of list)
            {
                if(sizeOf(entry) === scale) return entry;

                if(Math.abs(sizeOf(entry) - scale) < Math.abs(sizeOf(nearest) - scale)) nearest = entry;
            }

            return nearest;
        };

        const visualization = (this._type === RoomPlane.TYPE_LANDSCAPE) ? (pick(plane.animatedVisualization) ?? pick(plane.visualizations)) : pick(plane.visualizations);

        return { data, visualization };
    }

    // AIR PlaneMaterialCellMatrix.getColumns: a random matrix picks columns until the plane is covered, the others give all of them.
    private static getMatrixColumns(matrix: IAssetPlaneMaterialCellMatrix, width: number): IAssetPlaneMaterialCellColumn[]
    {
        const columns = matrix.columns ?? [];

        if(matrix.repeatMode !== 'random') return columns;

        const picked: IAssetPlaneMaterialCellColumn[] = [];

        if(!columns.length) return picked;

        let covered = 0;

        while(covered < width)
        {
            const column = columns[Randomizer.getValues(1, 0, (columns.length * 17631))[0] % columns.length];

            if(!column) break;

            picked.push(column);

            const columnWidth = Math.max(1, Math.trunc(column.width ?? 1));

            if(columnWidth <= 1) break;

            covered += columnWidth;
        }

        return picked;
    }

    private getScreenWidth(geometry: IRoomGeometry): number
    {
        const origin = geometry.getScreenPoint(new Vector3d(0, 0, 0));
        const unit = geometry.getScreenPoint(new Vector3d(0, 1, 0));

        if(!origin || !unit) return 0;

        return Math.round(this._leftSide.length * Math.abs(origin.x - unit.x));
    }

    // AIR RoomPlane.resolveMasks: the bitmap masks (doors, windows) as asset names placed on the plane texture.
    private resolveDrawingMasks(geometry: IRoomGeometry): PlaneDrawingData
    {
        if(!this._useMask) return null;

        const drawingData = new PlaneDrawingData();

        if(!this._maskManager) return drawingData;

        for(const bitmapMask of this._bitmapMasks)
        {
            if(!bitmapMask) continue;

            const mask = this._maskManager.getMask(bitmapMask.type);

            if(!mask) continue;

            const assetName = mask.getAssetName(geometry.scale);

            if(!assetName) continue;

            const normal = geometry.getCoordinatePosition(this._normal);
            const asset = mask.getGraphicAsset(geometry.scale, normal);

            if(!asset) continue;

            const x = Math.trunc(this._width * (1 - (bitmapMask.leftSideLoc / this._leftSide.length)));
            const y = Math.trunc(this._height * (1 - (bitmapMask.rightSideLoc / this._rightSide.length)));

            drawingData.addMask(assetName, new Point((x + asset.offsetX), (y + asset.offsetY)), asset.flipH, asset.flipV);
        }

        return drawingData;
    }

    /**
     * Behaviour from the AIR client (RoomPlane.getDrawingDatas): what the server needs to draw this plane for a photo,
     * one entry per visualization layer with its colour, its texture columns as asset names and the plane's masks.
     * The camera scene builder sets the corner points and the depth.
     */
    public getDrawingDatas(geometry: IRoomGeometry): IPlaneDrawingData[]
    {
        const drawingDatas: IPlaneDrawingData[] = [];

        if(!this._isVisible || !geometry) return drawingDatas;

        let maskData: PlaneDrawingData = null;

        try
        {
            maskData = this.resolveDrawingMasks(geometry);

            const { data, visualization } = this.getDrawingVisualization(geometry.scale);

            for(const entry of (visualization?.allLayers ?? []))
            {
                // Animated landscape layers are not PlaneVisualizationLayers in AIR, so they are not drawn here.
                if(!entry || (entry as IAssetPlaneVisualizationAnimatedLayer).items) continue;

                const layer = entry as IAssetPlaneVisualizationLayer;
                const layerColor = ((layer.color !== undefined) && (layer.color !== null)) ? layer.color : 0xFFFFFF;
                const material = layer.materialId ? (data?.materials?.find(item => (item.id === layer.materialId)) ?? null) : null;

                if(this._hasTexture && material)
                {
                    const normal = geometry.getCoordinatePosition(this._normal);
                    const matrix = (material.matrices ?? []).find(item => RoomPlane.matchesNormal(item, normal));

                    // AIR reads the missing matrix and stops on the error, keeping the layers it already has.
                    if(!matrix) break;

                    const drawingData = new PlaneDrawingData(maskData, RoomPlane.blendColor(this._color, layerColor), (matrix.align === 'bottom'));

                    Randomizer.setSeed(this._randomSeed);

                    for(const column of RoomPlane.getMatrixColumns(matrix, this.getScreenWidth(geometry)))
                    {
                        const assetNames: string[] = [];

                        for(const cell of (column.cells ?? []))
                        {
                            const texture = cell?.textureId ? data?.textures?.find(item => (item.id === cell.textureId)) : null;
                            const bitmap = texture ? (texture.bitmaps ?? []).find(item => RoomPlane.matchesNormal(item, normal)) : null;
                            const assetName = bitmap?.assetName;

                            if((assetName !== undefined) && (assetName !== null)) assetNames.push(assetName);
                        }

                        if(assetNames.length > 0)
                        {
                            if(column.repeatMode === 'none') assetNames.push('');

                            drawingData.addAssetColumn(assetNames);
                        }
                    }

                    if(drawingData.assetNameColumns.length > 0) drawingDatas.push(drawingData);
                }
                else
                {
                    drawingDatas.push(new PlaneDrawingData(maskData, RoomPlane.blendColor(this._color, layerColor)));
                }
            }
        }
        catch (error)
        {
            OctaneLogger.error('Error in getting RoomPlane drawing data.', error);
        }

        if(!drawingDatas.length) drawingDatas.push(new PlaneDrawingData(maskData, this._color));

        return drawingDatas;
    }

    private updateCorners(geometry: IRoomGeometry): void
    {
        this._cornerA.assign(geometry.getScreenPosition(this._location));
        this._cornerB.assign(geometry.getScreenPosition(Vector3d.sum(this._location, this._rightSide)));
        this._cornerC.assign(geometry.getScreenPosition(Vector3d.sum(Vector3d.sum(this._location, this._leftSide), this._rightSide)));
        this._cornerD.assign(geometry.getScreenPosition(Vector3d.sum(this._location, this._leftSide)));

        this._offset = geometry.getScreenPoint(this._origin);

        const axisOrigin = geometry.getScreenPoint(this._location);
        const axisX = geometry.getScreenPoint(Vector3d.sum(this._location, new Vector3d(1, 0, 0)));
        const axisY = geometry.getScreenPoint(Vector3d.sum(this._location, new Vector3d(0, 1, 0)));
        const axisZ = geometry.getScreenPoint(Vector3d.sum(this._location, new Vector3d(0, 0, 1)));

        if(axisOrigin && axisX && axisY && axisZ)
        {
            this._screenAxisX.set((axisX.x - axisOrigin.x), (axisX.y - axisOrigin.y));
            this._screenAxisY.set((axisY.x - axisOrigin.x), (axisY.y - axisOrigin.y));
            this._screenAxisZ.set((axisZ.x - axisOrigin.x), (axisZ.y - axisOrigin.y));
        }

        this._screenScale = geometry.scale;

        this._cornerA.x = Math.round(this._cornerA.x);
        this._cornerA.y = Math.round(this._cornerA.y);
        this._cornerB.x = Math.round(this._cornerB.x);
        this._cornerB.y = Math.round(this._cornerB.y);
        this._cornerC.x = Math.round(this._cornerC.x);
        this._cornerC.y = Math.round(this._cornerC.y);
        this._cornerD.x = Math.round(this._cornerD.x);
        this._cornerD.y = Math.round(this._cornerD.y);
        this._offset.x = Math.round(this._offset.x);
        this._offset.y = Math.round(this._offset.y);

        const minX = Math.min(this._cornerA.x, this._cornerB.x, this._cornerC.x, this._cornerD.x);
        const maxX = Math.max(this._cornerA.x, this._cornerB.x, this._cornerC.x, this._cornerD.x) - minX;
        const minY = Math.min(this._cornerA.y, this._cornerB.y, this._cornerC.y, this._cornerD.y);
        const maxY = Math.max(this._cornerA.y, this._cornerB.y, this._cornerC.y, this._cornerD.y) - minY;

        this._offset.x = (this._offset.x - minX);
        this._cornerA.x = (this._cornerA.x - minX);
        this._cornerB.x = (this._cornerB.x - minX);
        this._cornerC.x = (this._cornerC.x - minX);
        this._cornerD.x = (this._cornerD.x - minX);

        this._offset.y = (this._offset.y - minY);
        this._cornerA.y = (this._cornerA.y - minY);
        this._cornerB.y = (this._cornerB.y - minY);
        this._cornerC.y = (this._cornerC.y - minY);
        this._cornerD.y = (this._cornerD.y - minY);

        this._width = maxX;
        this._height = maxY;

        this._screenLocation.set(this._cornerA.x, this._cornerA.y);
    }

    private getMatrixForDimensions(width: number, height: number): Matrix
    {
        let a: number = (this._cornerD.x - this._cornerC.x);
        let b: number = (this._cornerD.y - this._cornerC.y);
        let c: number = (this._cornerB.x - this._cornerC.x);
        let d: number = (this._cornerB.y - this._cornerC.y);

        if((this._type === RoomPlane.TYPE_WALL) || (this._type === RoomPlane.TYPE_LANDSCAPE))
        {
            if(Math.abs((c - width)) <= 1) c = width;

            if(Math.abs((d - width)) <= 1) d = width;

            if(Math.abs((a - height)) <= 1) a = height;

            if(Math.abs((b - height)) <= 1) b = height;
        }

        const xScale: number = (c / width);
        const ySkew: number = (d / width);
        const xSkew: number = (a / height);
        const yScale: number = (b / height);

        const matrix = new Matrix(xScale, ySkew, xSkew, yScale);

        matrix.translate(this._cornerC.x, this._cornerC.y);

        return matrix;
    }

    public resetBitmapMasks(): void
    {
        this._hasWindowMask = false;
        this._windowMasks = [];

        if(this._disposed || !this._useMask || !this._bitmapMasks.length) return;

        this._maskChanged = true;
        this._bitmapMasks = [];
    }

    public addBitmapMask(maskType: string, leftSideLoc: number, rightSideLoc: number): boolean
    {
        if(!this._useMask) return false;

        for(const mask of this._bitmapMasks)
        {
            if(!mask) continue;

            if((((mask.type === maskType) && (mask.leftSideLoc === leftSideLoc)) && (mask.rightSideLoc === rightSideLoc))) return false;
        }

        const mask = new RoomPlaneBitmapMask(maskType, leftSideLoc, rightSideLoc);

        this._bitmapMasks.push(mask);
        this._maskChanged = true;

        return true;
    }

    public addWindowMask(leftSideLoc: number, rightSideLoc: number): void
    {
        this._windowMasks.push({ leftSideLoc, rightSideLoc });
        this._hasWindowMask = true;
    }

    public resetRectangleMasks(): void
    {
        if(!this._useMask || !this._rectangleMasks.length) return;

        this._maskChanged = true;
        this._rectangleMasks = [];
    }

    public addRectangleMask(leftLocation: number, rightLocation: number, leftLength: number, rightLength: number): boolean
    {
        if(this._useMask)
        {
            for(const mask of this._rectangleMasks)
            {
                if(!mask) continue;

                if((((mask.leftSideLoc === leftLocation) && (mask.rightSideLoc === rightLocation)) && (mask.leftSideLength === leftLength)) && (mask.rightSideLength === rightLength)) return false;
            }

            this._rectangleMasks.push(new RoomPlaneRectangleMask(leftLocation, rightLocation, leftLength, rightLength));
            this._maskChanged = true;

            return true;
        }

        return false;
    }

    private updateMask(container: Container, geometry: IRoomGeometry): boolean
    {
        if(container.children?.length) container.removeChildren();

        if(!container || !geometry || !this._useMask || (!this._bitmapMasks.length && !this._rectangleMasks.length) || !this._maskManager) return false;

        const normal = geometry.getCoordinatePosition(this._normal);

        let type: string = null;
        let posX = 0;
        let posY = 0;
        let i = 0;

        while(i < this._bitmapMasks.length)
        {
            const mask = this._bitmapMasks[i];

            if(mask)
            {
                type = mask.type;
                posX = (container.width - ((container.width * mask.leftSideLoc) / this._leftSide.length));
                posY = (container.height - ((container.height * mask.rightSideLoc) / this._rightSide.length));

                this._maskManager.addMaskToContainer(container, type, geometry.scale, normal, posX, posY);
            }

            i++;
        }

        i = 0;

        while(i < this._rectangleMasks.length)
        {
            const rectMask = this._rectangleMasks[i];

            if(rectMask)
            {
                posX = (container.width - ((container.width * rectMask.leftSideLoc) / this._leftSide.length));
                posY = (container.height - ((container.height * rectMask.rightSideLoc) / this._rightSide.length));

                const wd = ((container.width * rectMask.leftSideLength) / this._leftSide.length);
                const ht = ((container.height * rectMask.rightSideLength) / this._rightSide.length);

                const maskSprite = new Sprite(Texture.WHITE);

                maskSprite.tint = 0x000000;
                maskSprite.width = wd;
                maskSprite.height = ht;
                maskSprite.position.set(Math.trunc((posX - wd)), Math.trunc((posY - ht)));

                container.addChild(maskSprite);
            }

            i++;
        }

        this._maskChanged = false;

        if(!this._maskFilter) this._maskFilter = new PlaneMaskFilter({});

        if(!container.filters) container.filters = [ this._maskFilter ];

        return true;
    }

    public get canBeVisible(): boolean
    {
        return this._canBeVisible;
    }

    public set canBeVisible(flag: boolean)
    {
        if(flag === this._canBeVisible) return;

        this._canBeVisible = flag;

        // Direct drawing dropped the patches of a plane that could not be seen: build them again.
        if(RoomPlane.DIRECT_DRAW) this._geometryUpdateId = -1;
    }

    public get visible(): boolean
    {
        return (this._isVisible && this._canBeVisible);
    }

    public get offset(): Point
    {
        return this._offset;
    }

    public get relativeDepth(): number
    {
        return (this._relativeDepth + this._extraDepth);
    }

    public set extraDepth(value: number)
    {
        this._extraDepth = value;
    }

    public get color(): number
    {
        return this._color;
    }

    public set color(value: number)
    {
        this._color = value;
    }

    public get type(): number
    {
        return this._type;
    }

    public get leftSide(): IVector3D
    {
        return this._leftSide;
    }

    public get rightSide(): IVector3D
    {
        return this._rightSide;
    }

    public get location(): IVector3D
    {
        return this._location;
    }

    public get normal(): IVector3D
    {
        return this._normal;
    }

    public set id(value: string)
    {
        if(value === this._id) return;

        this._id = value;
    }

    public set maskManager(value: PlaneMaskManager)
    {
        this._maskManager = value;
    }

    public set roomId(value: string)
    {
        this._roomId = value;
    }

    public get uniqueId(): number
    {
        return this._uniqueId;
    }

    public get planeTexture(): Texture
    {
        return this._planeTexture;
    }

    // What the canvas draws when DIRECT_DRAW is on; null for the full-plane bake (planeTexture).
    public get drawData(): RoomPlaneDrawData
    {
        return (RoomPlane.DIRECT_DRAW ? this._drawData : null);
    }

    public get patchLayoutId(): number
    {
        return this._patchLayoutId;
    }

    public get patchRects(): Rectangle[]
    {
        return this._patchRects;
    }

    public set occluder(plane: RoomPlane)
    {
        this._occluder = plane;
    }

    public set occluderUsable(flag: boolean)
    {
        this._occluderUsable = flag;
    }

    public set hasTexture(flag: boolean)
    {
        this._hasTexture = flag;
    }

    public get isHighlighter(): boolean
    {
        return this._isHighlighter;
    }

    public set isHighlighter(flag: boolean)
    {
        this._isHighlighter = flag;
    }

    public get hasWindowMask(): boolean
    {
        return this._hasWindowMask;
    }

    public set hasWindowMask(flag: boolean)
    {
        this._hasWindowMask = flag;
    }
}

import { Rectangle, Texture } from 'pixi.js';
import { IRoomGeometry } from '../../IRoomGeometry';
import { IRoomObject } from '../IRoomObject';
import { IObjectVisualizationData } from './IRoomObjectVisualizationData';

export interface IRoomObjectVisualization
{
    initialize(data: IObjectVisualizationData): boolean;
    dispose(): void;
    // visible: whether the object had sprites on the canvas when it was last drawn; one off screen may put a redraw off.
    update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean, visible?: boolean): void;
    getBoundingRectangle(): Rectangle;
    getImage(): Texture;
    instanceId: number;
    object: IRoomObject;
    image: Texture;
    updateSpriteCounter: number;
}

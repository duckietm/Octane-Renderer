import { IAnimation } from './IAnimation';
import { IAnimationLayerData } from './IAnimationLayerData';

export interface IAnimationManager
{
    animations: Map<any, any>;
    getAnimation(name: string): IAnimation;
    getLayerData(name: string, layerId: number, type: string): IAnimationLayerData;
}

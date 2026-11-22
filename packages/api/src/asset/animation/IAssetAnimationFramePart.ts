import { IAssetAnimationFramePartItem } from './IAssetAnimationFramePartItem';

export interface IAssetAnimationFramePart
{
    id?: string;
    frame?: number;
    /** "counter": the part keeps the running frame number instead of {@link frame} (AIR 1.0.31). */
    frameSource?: string;
    base?: string;
    action?: string;
    dx?: number;
    dy?: number;
    dz?: number;
    dd?: number;
    items?: IAssetAnimationFramePartItem[];
}

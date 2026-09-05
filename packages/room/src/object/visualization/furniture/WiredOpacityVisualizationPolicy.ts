import { AlphaTolerance } from '@octane/api';

export const normalizeOpacityMultiplier = (value: number, fallback = 1): number =>
{
    if(!Number.isFinite(value)) return fallback;

    return Math.max(0, Math.min(1, value));
};

export const composeFurnitureAlphaMultiplier = (baseMultiplier: number, wiredMultiplier: number, hidden: boolean): number =>
{
    if(hidden) return 0;

    return normalizeOpacityMultiplier(baseMultiplier) * normalizeOpacityMultiplier(wiredMultiplier);
};

export const furnitureAlphaTolerance = (layerIgnoresMouse: boolean, wiredClickThrough: boolean): number =>
{
    return (layerIgnoresMouse || wiredClickThrough)
        ? AlphaTolerance.MATCH_NOTHING
        : AlphaTolerance.MATCH_OPAQUE_PIXELS;
};

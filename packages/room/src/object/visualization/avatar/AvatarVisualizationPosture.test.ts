import { describe, expect, it } from 'vitest';
import { AvatarVisualization } from './AvatarVisualization';

type AvatarVisualizationInternals = {
    _posture: string;
    _postureParameter: string;
    _postureOffset: number;
    _verticalOffset: number;
    object: null;
    updateScale(scale: number): void;
};

const getPostureOffset = (posture: string, scale: number) =>
{
    const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;
    const internals = visualization as unknown as AvatarVisualizationInternals;

    Object.assign(internals, {
        _posture: posture,
        _postureParameter: '',
        _verticalOffset: 0,
        object: null
    });

    internals.updateScale(scale);

    return internals._postureOffset;
};

describe('AvatarVisualization posture floor alignment', () =>
{
    it.each([ 'sit', 'lay' ])('moves the %s sprite down by half the avatar scale', posture =>
    {
        expect(getPostureOffset(posture, 64)).toBe(32);
    });

    it('does not move a standing avatar down', () =>
    {
        expect(getPostureOffset('std', 64)).toBe(0);
    });
});

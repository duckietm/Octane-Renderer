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

describe('AvatarVisualization lay posture parameter', () =>
{
    const layState = (parameter: string) =>
    {
        const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;
        const internals = visualization as unknown as AvatarVisualizationInternals & { _isLaying: boolean; _layInside: boolean };

        Object.assign(internals, { _posture: 'lay', _postureParameter: parameter, _verticalOffset: 0, object: null });

        internals.updateScale(64);

        return { laying: internals._isLaying, inside: internals._layInside };
    };

    it('lays on top of a bed for the bed height Habbo sends', () =>
    {
        expect(layState('1.73')).toEqual({ laying: true, inside: false });
    });

    // AIR validateActions: int(postureParameter) < 0, so -0.5 truncates to 0 and is not inside.
    it.each([ [ '-1', true ], [ '-2.5', true ], [ '-0.5', false ], [ '0', false ], [ '', false ] ])('lays inside for %s: %s', (parameter, inside) =>
    {
        expect(layState(parameter as string).inside).toBe(inside);
    });

    it('ignores the old per-bed offset suffix', () =>
    {
        expect(layState('1.9;5;0')).toEqual({ laying: true, inside: false });
    });
});


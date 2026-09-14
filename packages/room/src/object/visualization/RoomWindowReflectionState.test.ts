import { Vector3d } from '@octane/utils';
import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';
import { RoomWindowReflectionState } from './RoomWindowReflectionState';

const layer = () => ({ texture: Texture.WHITE, offsetX: 0, offsetY: 0, alpha: 1, flipH: false });

const wallLocation = new Vector3d(-0.5, 0, 0);
const wallNormal = new Vector3d(1, 0, 0);
const otherWallLocation = new Vector3d(0, -0.5, 0);
const otherWallNormal = new Vector3d(0, 1, 0);

describe('RoomWindowReflectionState.getSignatureNear', () =>
{
    afterEach(() => RoomWindowReflectionState.clearRoom(null));

    it('only changes for the wall a subject is near', () =>
    {
        RoomWindowReflectionState.setUnit(1, [ layer() ], new Map(), 0, new Vector3d(0, 5, 0), new Vector3d(0, 5, 0), 'room');

        const near = RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1);
        const far = RoomWindowReflectionState.getSignatureNear(otherWallLocation, otherWallNormal, 'room', 1.1);

        expect(near).not.toBe('');
        expect(far).toBe('');
    });

    it('is stable until the subject is pushed again', () =>
    {
        RoomWindowReflectionState.setAvatar(7, Texture.WHITE, new Map(), 0, new Vector3d(0, 3, 0), 0, 'room');

        const first = RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1);
        const second = RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1);

        expect(second).toBe(first);

        RoomWindowReflectionState.setAvatar(7, Texture.WHITE, new Map(), 0, new Vector3d(0.2, 3, 0), 0, 'room');

        expect(RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1)).not.toBe(first);
    });

    it('changes when a subject leaves', () =>
    {
        RoomWindowReflectionState.setUnit(2, [ layer() ], new Map(), 0, new Vector3d(0, 1, 0), new Vector3d(0, 1, 0), 'room');

        const withUnit = RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1);

        RoomWindowReflectionState.removeUnit(2, 'room');

        expect(RoomWindowReflectionState.getSignatureNear(wallLocation, wallNormal, 'room', 1.1)).not.toBe(withUnit);
    });
});

describe('RoomWindowReflectionState.reflectDirection', () =>
{
    it('flips a subject facing the glass and keeps one facing along it', () =>
    {
        expect(RoomWindowReflectionState.reflectDirection(2 * 45, 1, 0)).toBe(6 * 45);
        expect(RoomWindowReflectionState.reflectDirection(0, 1, 0)).toBe(0);
    });
});

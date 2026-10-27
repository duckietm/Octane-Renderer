import { IRoomObjectController, IRoomObjectModel, IVector3D, RoomObjectVariable } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { ObjectAvatarFlatControlUpdateMessage } from '../../messages';
import { AvatarLogic } from './AvatarLogic';

const setup = () =>
{
    const store = new Map<string, unknown>();
    const model = {
        getValue: (key: string) => store.get(key),
        setValue: (key: string, value: unknown) => store.set(key, value)
    } as unknown as IRoomObjectModel;
    const location = new Vector3d();
    const direction = new Vector3d();
    const object = {
        getLocation: () => location,
        setLocation: (vector: IVector3D) => vector && location.assign(vector),
        getDirection: () => direction,
        setDirection: (vector: IVector3D) => vector && direction.assign(vector),
        setLogic: () => null,
        model
    } as unknown as IRoomObjectController;
    const logic = new AvatarLogic();

    logic.setObject(object);

    return { logic, store };
};

describe('AvatarLogic flat control level', () =>
{
    it('stores 0..5 and 0 for anything else, as AIR does', () =>
    {
        const { logic, store } = setup();

        for(const [ sent, stored ] of [ [ NaN, 0 ], [ 7, 0 ], [ -1, 0 ], [ 3, 3 ], [ 5, 5 ] ])
        {
            logic.processUpdateMessage(new ObjectAvatarFlatControlUpdateMessage(sent));
            expect(store.get(RoomObjectVariable.FIGURE_FLAT_CONTROL)).toBe(stored);
        }
    });
});

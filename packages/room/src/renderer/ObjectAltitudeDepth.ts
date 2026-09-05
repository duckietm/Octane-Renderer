import { AvatarAction, IRoomObject, RoomObjectVariable } from '@octane/api';

// Sort-depth weight per unit of object altitude. The geometry's depth vector is
// nearly horizontal (0.5° vertical angle), so altitude alone contributes almost
// nothing to painter ordering. Classic ride-on furniture depends on it: queue
// tiles push their layers back 0.9 tiles (asset z -900) and expect the rider's
// altitude (0.45) to cover the remaining fraction of the tile step (sqrt(0.5)
// per tile). 0.2 gives a 0.45-high rider ~0.09 depth (> the 0.071 shortfall),
// while a closer tile still outranks anything elevated less than ~3.5 units.
export const OBJECT_ALTITUDE_DEPTH: number = 0.2;

// How much of an object's altitude is weighted into its sort depth.
//
// A unit resting on furniture must still sort against that furniture's own
// layers: a sofa pushes its front layers barely a hundredth of a unit ahead of
// the seat, so weighting the seat height - a whole unit - paints the sitter over
// the armrests. The floor under the seat is weighted all the same: it is the
// altitude the seat itself is weighted by, and dropping it lets a step in the
// room push the sofa 0.2 forward of its own sitter, which paints the whole seat
// over the avatar. Ride-on furniture carries standing riders, so it keeps the
// full weighting.
export const getObjectAltitudeDepth = (object: IRoomObject): number =>
{
    const altitude = object.getLocation().z;
    const posture = object.model?.getValue<string>(RoomObjectVariable.FIGURE_POSTURE);

    if((posture === AvatarAction.POSTURE_SIT) || (posture === AvatarAction.POSTURE_LAY))
    {
        // the seat surface the unit was raised to, reported by the unit status
        const seatHeight = (object.model?.getValue<number>(RoomObjectVariable.FIGURE_VERTICAL_OFFSET) || 0);

        return ((altitude - seatHeight) * OBJECT_ALTITUDE_DEPTH);
    }

    return (altitude * OBJECT_ALTITUDE_DEPTH);
};

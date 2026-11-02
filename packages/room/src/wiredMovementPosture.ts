import { ObjectRolling } from '@octane/api';

const isSeatedPosture = (posture: string): boolean => ((posture === 'sit') || (posture === 'lay'));

/**
 * The posture a wired user movement gives: a walk walks, a slide stands, except that a user a seat or bed carries (the
 * server moves a sitter along when wired moves the seat on its tile) keeps sitting or lying. Null keeps the posture.
 */
export const wiredMovementPosture = (movementType: string, currentPosture: string): string =>
{
    if(movementType === ObjectRolling.MOVE) return 'mv';
    if(isSeatedPosture(currentPosture)) return null;

    return 'std';
};

/**
 * How far a carried user is drawn above the z the server sends. The server sends a sitter's seat z, while its sit status
 * raised the avatar by the seat height (the vertical offset); a slide keeps that height, so the sitter stays on the
 * seat instead of sinking into it every tick. A walk or a standing user gets none.
 */
export const wiredMovementSeatOffset = (movementType: string, currentPosture: string, verticalOffset: number): number =>
{
    if(movementType === ObjectRolling.MOVE || !isSeatedPosture(currentPosture)) return 0;
    if(!Number.isFinite(verticalOffset) || (verticalOffset <= 0)) return 0;

    return verticalOffset;
};

interface IWiredSeatPoint { x: number; y: number; z?: number; }
interface IWiredSeatMove { location: IWiredSeatPoint; targetLocation: IWiredSeatPoint; }
export interface IWiredSeatFurniMove extends IWiredSeatMove { id: number; }
export interface IWiredSeatFootprint { width: number; length: number; }

const RIDE_HEIGHT_EPSILON = 0.01;

const staysOnTile = (move: IWiredSeatMove): boolean =>
    !!move && !!move.location && !!move.targetLocation
    && (move.location.x === move.targetLocation.x) && (move.location.y === move.targetLocation.y);

/**
 * The furni a user rides in a batch of wired movements: one the same batch moves on its tile, whose footprint holds the
 * user, who stays on its tile too. A sitter or a lying user rides its seat; a standing user the highest such furni at
 * or under its feet. Each side of a chained ride queues its own slides, and network jitter left the two queues a few
 * hops apart; a rider that follows the furni object stays on it. Null when none, or for a walk.
 */
export const wiredSeatAnchorId = (
    movementType: string,
    currentPosture: string,
    userMove: IWiredSeatMove,
    furniMoves: ReadonlyArray<IWiredSeatFurniMove>,
    footprint: (furniId: number) => IWiredSeatFootprint = null): number =>
{
    if(movementType === ObjectRolling.MOVE || (currentPosture === 'mv') || !staysOnTile(userMove) || !furniMoves) return null;

    const ux = userMove.targetLocation.x;
    const uy = userMove.targetLocation.y;
    const uz = userMove.targetLocation.z;
    let ridden: IWiredSeatFurniMove = null;

    for(const furni of furniMoves)
    {
        if(!staysOnTile(furni)) continue;

        const size = (footprint && footprint(furni.id)) || { width: 1, length: 1 };
        const dx = ux - furni.targetLocation.x;
        const dy = uy - furni.targetLocation.y;

        if((dx < 0) || (dy < 0) || (dx >= Math.max(1, size.width)) || (dy >= Math.max(1, size.length))) continue;

        const fz = furni.targetLocation.z;

        // Without heights the first furni on the tile is the one.
        if(!Number.isFinite(uz) || !Number.isFinite(fz))
        {
            if(!ridden) ridden = furni;

            continue;
        }

        if(fz > (uz + RIDE_HEIGHT_EPSILON)) continue;

        if(!ridden || !Number.isFinite(ridden.targetLocation.z) || (fz > ridden.targetLocation.z)) ridden = furni;
    }

    return ridden ? ridden.id : null;
};

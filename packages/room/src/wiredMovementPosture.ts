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

interface IWiredSeatPoint { x: number; y: number; }
interface IWiredSeatMove { location: IWiredSeatPoint; targetLocation: IWiredSeatPoint; }
export interface IWiredSeatFurniMove extends IWiredSeatMove { id: number; }
export interface IWiredSeatFootprint { width: number; length: number; }

const staysOnTile = (move: IWiredSeatMove): boolean =>
    !!move && !!move.location && !!move.targetLocation
    && (move.location.x === move.targetLocation.x) && (move.location.y === move.targetLocation.y);

/**
 * The seat a sitter or lying user rides in a batch of wired movements: a furni the same batch moves on its tile whose
 * footprint holds the user, who stays on its tile too. Each side of a chained ride queues its own slides, and network
 * jitter left the two queues a few hops apart; a rider that follows its seat object stays on it. Null when none.
 */
export const wiredSeatAnchorId = (
    movementType: string,
    currentPosture: string,
    userMove: IWiredSeatMove,
    furniMoves: ReadonlyArray<IWiredSeatFurniMove>,
    footprint: (furniId: number) => IWiredSeatFootprint = null): number =>
{
    if(movementType === ObjectRolling.MOVE || !isSeatedPosture(currentPosture) || !staysOnTile(userMove) || !furniMoves) return null;

    const ux = userMove.targetLocation.x;
    const uy = userMove.targetLocation.y;

    for(const furni of furniMoves)
    {
        if(!staysOnTile(furni)) continue;

        const size = (footprint && footprint(furni.id)) || { width: 1, length: 1 };
        const dx = ux - furni.targetLocation.x;
        const dy = uy - furni.targetLocation.y;

        if((dx >= 0) && (dy >= 0) && (dx < Math.max(1, size.width)) && (dy < Math.max(1, size.length))) return furni.id;
    }

    return null;
};

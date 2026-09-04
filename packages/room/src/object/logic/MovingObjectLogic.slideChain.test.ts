import { IRoomObjectController, IVector3D } from '@nitrots/api';
import { Vector3d } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { ObjectMoveUpdateMessage } from '../../messages';
import { MovingObjectLogic } from './MovingObjectLogic';

const createObject = () =>
{
    const location = new Vector3d();
    const direction = new Vector3d();

    return {
        location,
        getLocation: () => location,
        setLocation: (vector: IVector3D) =>
        {
            location.assign(vector);
        },
        getDirection: () => direction,
        setDirection: (vector: IVector3D) =>
        {
            if(vector) direction.assign(vector);
        },
        setLogic: () => null,
        model: null
    } as unknown as IRoomObjectController & { location: Vector3d };
};

const slide = (fromX: number, toX: number, duration: number = 500) =>
    new ObjectMoveUpdateMessage(new Vector3d(fromX, 5, 0.5), new Vector3d(toX, 5, 0.5), null, true, duration);

// Drives the logic at ~60fps, delivering each message right after the first
// tick at/past its arrival time, and samples x after every tick.
const simulate = (arrivals: { time: number, message: ObjectMoveUpdateMessage }[], totalTime: number) =>
{
    const object = createObject();
    const logic = new MovingObjectLogic();

    logic.setObject(object);

    const samples: { time: number, x: number }[] = [];
    const pending = [...arrivals];

    for(let time = 16; time <= totalTime; time += 16)
    {
        logic.update(time);

        while(pending.length && (pending[0].time <= time))
        {
            logic.processUpdateMessage(pending.shift().message);
        }

        samples.push({ time, x: object.location.x });
    }

    return samples;
};

const stallsBetween = (samples: { time: number, x: number }[], from: number, to: number) =>
    samples.filter((sample, index) => (index > 0) && (sample.time > from) && (sample.time <= to) && (sample.x === samples[index - 1].x)).length;

describe('MovingObjectLogic slide chaining', () =>
{
    it('moves continuously through a fast roller chain after the first hop', () =>
    {
        // 500ms server cadence with realistic delivery jitter
        const samples = simulate(
            [
                { time: 16, message: slide(5, 6) },
                { time: 540, message: slide(6, 7) },
                { time: 1020, message: slide(7, 8) },
                { time: 1540, message: slide(8, 9) }
            ],
            2600
        );

        // the chain is only detectable from the second pulse on, so one
        // stall between hop 0 and hop 1 is expected...
        expect(stallsBetween(samples, 16, 590)).toBeGreaterThan(0);

        // ...but once chained the object never stands still between hops
        expect(stallsBetween(samples, 600, 2100)).toBe(0);

        // and it still arrives exactly at the final tile
        expect(samples[samples.length - 1].x).toBeCloseTo(9, 5);
    });

    it('keeps the classic move-then-rest look for slow roller cadences', () =>
    {
        // 1000ms cadence: each 500ms hop should complete and rest
        const samples = simulate(
            [
                { time: 16, message: slide(5, 6) },
                { time: 1016, message: slide(6, 7) },
                { time: 2016, message: slide(7, 8) }
            ],
            3200
        );

        expect(stallsBetween(samples, 600, 1000)).toBeGreaterThan(0);
        expect(stallsBetween(samples, 1600, 2000)).toBeGreaterThan(0);
        expect(samples[samples.length - 1].x).toBeCloseTo(8, 5);
    });

    it('keeps the exact duration of one-shot slides (wired choreography)', () =>
    {
        const samples = simulate([{ time: 16, message: slide(5, 6, 800) }], 1400);

        const arrivedAt = samples.find((sample) => Math.abs(sample.x - 6) < 1e-9);

        expect(arrivedAt).toBeDefined();
        // 800ms duration, started at t=16, frame-quantized
        expect(arrivedAt.time).toBeGreaterThanOrEqual(800);
        expect(arrivedAt.time).toBeLessThanOrEqual(848);
    });

    it('does not teleport to the hop end when a chained pulse arrives mid-interpolation', () =>
    {
        const samples = simulate(
            [
                { time: 16, message: slide(5, 6) },
                { time: 480, message: slide(6, 7) } // arrives while hop 0 still runs
            ],
            1400
        );

        // x must never jump by more than one smooth step per frame
        for(let index = 1; index < samples.length; index++)
        {
            expect(Math.abs(samples[index].x - samples[index - 1].x)).toBeLessThan(0.12);
        }

        expect(samples[samples.length - 1].x).toBeCloseTo(7, 5);
    });
});

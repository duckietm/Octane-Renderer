import { describe, it, expect, beforeEach } from 'vitest';
import { NumberBank } from '../NumberBank';

describe('NumberBank', () =>
{
    describe('constructor', () =>
    {
        it('should create bank with specified size', () =>
        {
            const bank = new NumberBank(5);

            // Should be able to reserve 5 numbers (LIFO order - pops from end)
            expect(bank.reserveNumber()).toBe(4);
            expect(bank.reserveNumber()).toBe(3);
            expect(bank.reserveNumber()).toBe(2);
            expect(bank.reserveNumber()).toBe(1);
            expect(bank.reserveNumber()).toBe(0);
            expect(bank.reserveNumber()).toBe(-1); // No more available
        });

        it('should handle negative size as zero', () =>
        {
            const bank = new NumberBank(-5);
            expect(bank.reserveNumber()).toBe(-1);
        });

        it('should handle zero size', () =>
        {
            const bank = new NumberBank(0);
            expect(bank.reserveNumber()).toBe(-1);
        });
    });

    describe('reserveNumber', () =>
    {
        let bank: NumberBank;

        beforeEach(() =>
        {
            bank = new NumberBank(3);
        });

        it('should return numbers in LIFO order (stack behavior)', () =>
        {
            // Numbers are added 0, 1, 2 to the array
            // pop() returns from the end, so we get 2, 1, 0
            expect(bank.reserveNumber()).toBe(2);
            expect(bank.reserveNumber()).toBe(1);
            expect(bank.reserveNumber()).toBe(0);
        });

        it('should return -1 when no numbers available', () =>
        {
            bank.reserveNumber();
            bank.reserveNumber();
            bank.reserveNumber();

            expect(bank.reserveNumber()).toBe(-1);
        });
    });

    describe('freeNumber', () =>
    {
        let bank: NumberBank;

        beforeEach(() =>
        {
            bank = new NumberBank(3);
        });

        it('should make number available again after freeing', () =>
        {
            const num = bank.reserveNumber();
            bank.freeNumber(num);

            // The freed number should be available again
            expect(bank.reserveNumber()).toBe(num);
        });

        it('should handle freeing in different order', () =>
        {
            const n1 = bank.reserveNumber();
            const n2 = bank.reserveNumber();
            const n3 = bank.reserveNumber();

            // Free in middle order
            bank.freeNumber(n2);
            bank.freeNumber(n1);

            // Should get them back in LIFO order
            expect(bank.reserveNumber()).toBe(n1);
            expect(bank.reserveNumber()).toBe(n2);
        });

        it('should ignore freeing numbers not in reserved list', () =>
        {
            bank.reserveNumber(); // reserves 2

            // Try to free a number that wasn't reserved
            bank.freeNumber(999);

            // Should still work normally
            expect(bank.reserveNumber()).toBe(1);
        });

        it('should allow reusing freed numbers', () =>
        {
            // Reserve all
            const n1 = bank.reserveNumber();
            const n2 = bank.reserveNumber();
            const n3 = bank.reserveNumber();

            // Free and re-reserve multiple times
            bank.freeNumber(n1);
            const reused1 = bank.reserveNumber();
            expect(reused1).toBe(n1);

            bank.freeNumber(n2);
            bank.freeNumber(reused1);

            expect(bank.reserveNumber()).toBe(reused1);
            expect(bank.reserveNumber()).toBe(n2);
        });
    });

    describe('dispose', () =>
    {
        it('should set internal arrays to null', () =>
        {
            const bank = new NumberBank(5);
            bank.reserveNumber();

            bank.dispose();

            // After dispose, reserveNumber should fail (arrays are null)
            // This will throw an error, which is expected behavior
            expect(() => bank.reserveNumber()).toThrow();
        });
    });

    describe('edge cases', () =>
    {
        it('should handle large bank size', () =>
        {
            const bank = new NumberBank(1000);

            // Reserve all
            for(let i = 0; i < 1000; i++)
            {
                expect(bank.reserveNumber()).toBeGreaterThanOrEqual(0);
            }

            expect(bank.reserveNumber()).toBe(-1);
        });

        it('should maintain consistency after multiple reserve/free cycles', () =>
        {
            const bank = new NumberBank(10);
            const reserved: number[] = [];

            // Reserve 5
            for(let i = 0; i < 5; i++)
            {
                reserved.push(bank.reserveNumber());
            }

            // Free 3
            bank.freeNumber(reserved[0]);
            bank.freeNumber(reserved[2]);
            bank.freeNumber(reserved[4]);

            // Reserve 3 more (should get the freed ones)
            const newReserved: number[] = [];
            for(let i = 0; i < 3; i++)
            {
                newReserved.push(bank.reserveNumber());
            }

            // All previously freed numbers should be reserved again
            expect(newReserved).toContain(reserved[0]);
            expect(newReserved).toContain(reserved[2]);
            expect(newReserved).toContain(reserved[4]);
        });
    });
});

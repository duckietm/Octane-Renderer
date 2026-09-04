import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../ColorConverter';

describe('ColorConverter', () =>
{
    describe('hex2rgb', () =>
    {
        it('should convert hex to RGB array', () =>
        {
            const result = ColorConverter.hex2rgb(0xFF0000);
            expect(result[0]).toBeCloseTo(1); // Red
            expect(result[1]).toBeCloseTo(0); // Green
            expect(result[2]).toBeCloseTo(0); // Blue
        });

        it('should convert white correctly', () =>
        {
            const result = ColorConverter.hex2rgb(0xFFFFFF);
            expect(result[0]).toBeCloseTo(1);
            expect(result[1]).toBeCloseTo(1);
            expect(result[2]).toBeCloseTo(1);
        });

        it('should convert black correctly', () =>
        {
            const result = ColorConverter.hex2rgb(0x000000);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(0);
            expect(result[2]).toBeCloseTo(0);
        });

        it('should use provided output array', () =>
        {
            const out: number[] = [];
            const result = ColorConverter.hex2rgb(0x00FF00, out);
            expect(result).toBe(out);
            expect(out[0]).toBeCloseTo(0);
            expect(out[1]).toBeCloseTo(1);
            expect(out[2]).toBeCloseTo(0);
        });
    });

    describe('rgb2hex', () =>
    {
        it('should convert RGB array to hex', () =>
        {
            const result = ColorConverter.rgb2hex([1, 0, 0]);
            expect(result).toBe(0xFF0000);
        });

        it('should convert white correctly', () =>
        {
            const result = ColorConverter.rgb2hex([1, 1, 1]);
            expect(result).toBe(0xFFFFFF);
        });

        it('should convert black correctly', () =>
        {
            const result = ColorConverter.rgb2hex([0, 0, 0]);
            expect(result).toBe(0x000000);
        });
    });

    describe('getHex', () =>
    {
        it('should convert number to two-digit hex string', () =>
        {
            expect(ColorConverter.getHex(0)).toBe('00');
            expect(ColorConverter.getHex(15)).toBe('0f');
            expect(ColorConverter.getHex(16)).toBe('10');
            expect(ColorConverter.getHex(255)).toBe('ff');
        });

        it('should return 00 for NaN', () =>
        {
            expect(ColorConverter.getHex(NaN)).toBe('00');
        });
    });

    describe('int2rgb', () =>
    {
        it('should convert integer to RGBA string', () =>
        {
            const result = ColorConverter.int2rgb(0xFF0000);
            expect(result).toBe('rgba(255,0,0,1)');
        });

        it('should convert green correctly', () =>
        {
            const result = ColorConverter.int2rgb(0x00FF00);
            expect(result).toBe('rgba(0,255,0,1)');
        });

        it('should convert blue correctly', () =>
        {
            const result = ColorConverter.int2rgb(0x0000FF);
            expect(result).toBe('rgba(0,0,255,1)');
        });
    });

    describe('rgbToHSL', () =>
    {
        it('should convert red to HSL', () =>
        {
            const result = ColorConverter.rgbToHSL(0xFF0000);
            // Red has hue 0
            const h = (result >> 16) & 0xFF;
            const s = (result >> 8) & 0xFF;
            const l = result & 0xFF;

            expect(h).toBe(0);
            expect(s).toBe(255); // Full saturation
            expect(l).toBe(128); // 50% lightness (rounded)
        });

        it('should convert white to HSL', () =>
        {
            const result = ColorConverter.rgbToHSL(0xFFFFFF);
            const h = (result >> 16) & 0xFF;
            const s = (result >> 8) & 0xFF;
            const l = result & 0xFF;

            expect(s).toBe(0); // No saturation for white
            expect(l).toBe(255); // Full lightness
        });

        it('should convert black to HSL', () =>
        {
            const result = ColorConverter.rgbToHSL(0x000000);
            const h = (result >> 16) & 0xFF;
            const s = (result >> 8) & 0xFF;
            const l = result & 0xFF;

            expect(s).toBe(0); // No saturation for black
            expect(l).toBe(0); // No lightness
        });
    });

    describe('hslToRGB', () =>
    {
        it('should convert pure red HSL to RGB', () =>
        {
            // Pure red: H=0, S=255, L=128
            const hsl = (0 << 16) + (255 << 8) + 128;
            const result = ColorConverter.hslToRGB(hsl);

            const r = (result >> 16) & 0xFF;
            const g = (result >> 8) & 0xFF;
            const b = result & 0xFF;

            // Due to floating point precision in the algorithm, we allow small variance
            expect(r).toBe(255);
            expect(g).toBeLessThanOrEqual(2); // Small rounding variance
            expect(b).toBeLessThanOrEqual(2);
        });

        it('should convert grayscale (no saturation)', () =>
        {
            // Gray: H=0, S=0, L=128
            const hsl = (0 << 16) + (0 << 8) + 128;
            const result = ColorConverter.hslToRGB(hsl);

            const r = (result >> 16) & 0xFF;
            const g = (result >> 8) & 0xFF;
            const b = result & 0xFF;

            expect(r).toBe(128);
            expect(g).toBe(128);
            expect(b).toBe(128);
        });
    });

    describe('colorize', () =>
    {
        it('should return original color when colorizing with white', () =>
        {
            const color = 0xFF0000;
            const result = ColorConverter.colorize(color, 0xFFFFFFFF);
            expect(result).toBe(color);
        });

        it('should colorize red with blue filter', () =>
        {
            const colorA = 0xFFFFFF; // White
            const colorB = 0x0000FF; // Blue filter
            const result = ColorConverter.colorize(colorA, colorB);

            const r = (result >> 16) & 0xFF;
            const g = (result >> 8) & 0xFF;
            const b = result & 0xFF;

            expect(r).toBe(0);
            expect(g).toBe(0);
            expect(b).toBe(255);
        });
    });

    describe('roundtrip conversions', () =>
    {
        it('should maintain color through RGB to HSL to RGB conversion', () =>
        {
            const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];

            for(const original of colors)
            {
                const hsl = ColorConverter.rgbToHSL(original);
                const result = ColorConverter.hslToRGB(hsl);

                // Allow rounding differences due to float precision in HSL conversion
                const origR = (original >> 16) & 0xFF;
                const origG = (original >> 8) & 0xFF;
                const origB = original & 0xFF;

                const resultR = (result >> 16) & 0xFF;
                const resultG = (result >> 8) & 0xFF;
                const resultB = result & 0xFF;

                // HSL conversion can have up to 5 units of variance due to rounding
                expect(Math.abs(origR - resultR)).toBeLessThanOrEqual(5);
                expect(Math.abs(origG - resultG)).toBeLessThanOrEqual(5);
                expect(Math.abs(origB - resultB)).toBeLessThanOrEqual(5);
            }
        });
    });
});

import { describe, expect, it } from 'vitest';
import { FurnitureRoomBrandingLogic } from './FurnitureRoomBrandingLogic';

describe('FurnitureRoomBrandingLogic.secureImageUrl', () =>
{
    it('upgrades an http address on an https page', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('http://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('HTTP://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
    });

    it('keeps the address on an http page, and an https or relative one anywhere', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('http://localhost/a.png', 'http:')).toBe('http://localhost/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('https://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('/images/a.png', 'https:')).toBe('/images/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('', 'https:')).toBe('');
    });

    it('only touches the scheme at the start', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('https://proxy.example/?u=http://x/a.png', 'https:')).toBe('https://proxy.example/?u=http://x/a.png');
    });
});

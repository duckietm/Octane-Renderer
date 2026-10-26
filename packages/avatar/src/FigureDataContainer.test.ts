import { describe, expect, it } from 'vitest';
import { FigureDataContainer } from './FigureDataContainer';

describe('FigureDataContainer', () =>
{
    it('keeps the companion (pt) and misc (mc) parts, as AIR does', () =>
    {
        const container = new FigureDataContainer();
        container.loadAvatarData('hd-180-1.pt-123-45.mc-9-1', FigureDataContainer.MALE);

        const figure = container.getFigureString();

        expect(figure).toContain('pt-123-45');
        expect(figure).toContain('mc-9-1');
    });
});

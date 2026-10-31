import { describe, expect, it } from 'vitest';
import { RoomObjectSpriteVisualization } from './RoomObjectSpriteVisualization';

type FakeSprite = { texture: object; visible: boolean; width: number; height: number; offsetX: number; offsetY: number; flipH?: boolean; flipV?: boolean };

const bounds = (sprites: FakeSprite[]) =>
    RoomObjectSpriteVisualization.prototype.getBoundingRectangle.call({
        totalSprites: sprites.length,
        getSprite: (index: number) => sprites[index]
    });

const sprite = (offsetX: number, offsetY: number, width: number, height: number, visible = true): FakeSprite =>
    ({ texture: {}, visible, width, height, offsetX, offsetY });

describe('RoomObjectSpriteVisualization.getBoundingRectangle', () =>
{
    it('leaves the origin out when the first layer is hidden', () =>
    {
        const rectangle = bounds([ sprite(0, 0, 10, 10, false), sprite(20, 30, 5, 5) ]);

        expect([ rectangle.x, rectangle.y, rectangle.width, rectangle.height ]).toEqual([ 20, 30, 5, 5 ]);
    });

    it('keeps the right edge when a later layer reaches further left', () =>
    {
        const rectangle = bounds([ sprite(10, 10, 20, 20), sprite(0, 15, 5, 5) ]);

        expect([ rectangle.x, rectangle.y, rectangle.width, rectangle.height ]).toEqual([ 0, 10, 30, 20 ]);
    });

    it('is empty when nothing is visible', () =>
    {
        const rectangle = bounds([ sprite(5, 5, 5, 5, false) ]);

        expect([ rectangle.x, rectangle.y, rectangle.width, rectangle.height ]).toEqual([ 0, 0, 0, 0 ]);
    });
});

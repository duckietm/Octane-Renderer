import { describe, expect, it } from 'vitest';
import { WiredFurniHighlightParser, WiredFurniVisualizationStateParser, WiredUserTransparencyParser } from './WiredVisualEffectsParsers';

// A wrapper over a plain list of values, read in order.
const wrapper = (values: (number | boolean)[]) =>
{
    let index = 0;

    return {
        readInt: () => values[index++] as number,
        readBoolean: () => values[index++] as boolean,
        get remaining()
        {
            return values.length - index;
        }
    };
};

describe('wired visual effect parsers', () =>
{
    it('reads a furni highlight: ids, then type, strength, colour, animation and easing', () =>
    {
        const parser = new WiredFurniHighlightParser();
        const data = wrapper([ 2, 15, -7, 4, 76, 0xFFFFFF, 1, 0 ]);

        expect(parser.parse(data as never)).toBe(true);
        expect(parser.furniIds).toEqual([ 15, -7 ]);
        expect([ parser.highlightType, parser.strength, parser.color, parser.animationMode, parser.easingMode ]).toEqual([ 4, 76, 0xFFFFFF, 1, 0 ]);
        expect(data.remaining).toBe(0);
    });

    it('reads a user transparency by room index', () =>
    {
        const parser = new WiredUserTransparencyParser();
        const data = wrapper([ 1, 3, 100, true, 2 ]);

        expect(parser.parse(data as never)).toBe(true);
        expect(parser.roomIndices).toEqual([ 3 ]);
        expect([ parser.transparency, parser.allowClickThrough, parser.easingMode ]).toEqual([ 100, true, 2 ]);
    });

    it('reads the room-entry state: the transparency list, then the highlight list', () =>
    {
        const parser = new WiredFurniVisualizationStateParser();
        const data = wrapper([ 1, -4, 100, false, 0, 1, 9, 3, 50, 0xFF0000, 0, 2 ]);

        expect(parser.parse(data as never)).toBe(true);
        expect(parser.transparencies).toEqual([ { id: -4, transparency: 100, allowClickThrough: false, easingMode: 0 } ]);
        expect(parser.highlights).toEqual([ { id: 9, highlightType: 3, strength: 50, color: 0xFF0000, animationMode: 0, easingMode: 2 } ]);
        expect(data.remaining).toBe(0);
    });

    it('refuses an impossible count', () =>
    {
        expect(() => new WiredFurniHighlightParser().parse(wrapper([ -1 ]) as never)).toThrow();
    });
});

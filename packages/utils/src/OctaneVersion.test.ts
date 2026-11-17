import { VERSION } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { OctaneVersion } from './OctaneVersion';

describe('OctaneVersion', () =>
{
    it('names the client, the renderer and Pixi, with the version of Pixi only', () =>
    {
        expect(OctaneVersion.describe()).toBe(`Octane | Octane-Renderer | Pixijs ${VERSION}`);
        expect(OctaneVersion.describe()).toMatch(/^Octane \| Octane-Renderer \| Pixijs \d+\.\d+\.\d+$/);
    });

    it('draws one bar: a style for every mark, all on the same height', () =>
    {
        const [text, ...styles] = OctaneVersion.banner();

        expect(text.match(/%c/g)).toHaveLength(styles.length);
        expect(text.replace(/%c/g, '').replace(/\s+/g, ' ').trim()).toBe(`Octane | Octane-Renderer | Pixijs ${VERSION}`);

        // Every drawn part has the same font size and padding, so nothing steps up or down along the bar.
        for(const style of styles.slice(0, -1)) expect(style).toContain('font-size: 13px; line-height: 16px; padding: 7px 0;');
    });
});

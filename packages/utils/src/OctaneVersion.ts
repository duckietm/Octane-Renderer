import { VERSION as PIXI_VERSION } from 'pixi.js';

/** One console bar: every part shares the height and the font, so the parts join without a seam. */
const BAR = 'font-family: system-ui, sans-serif; font-size: 13px; line-height: 16px; padding: 7px 0;';
const BAR_NAME = `${BAR} background: #1a3a5c; color: #ffffff; font-weight: 700;`;
const BAR_DIVIDER = `${BAR} background: #1a3a5c; color: #5f86ad; font-weight: 400;`;
const BAR_VERSION = `${BAR} background: #3d7ab5; color: #ffffff; font-weight: 700; border-radius: 0 6px 6px 0;`;

export class OctaneVersion
{
    public static RENDERER_VERSION: string = '3.6.0';
    public static UI_VERSION: string = '3.6.0';

    /** What the client is built from, on one line: `Octane | Octane-Renderer | Pixijs 8.23.0`. */
    public static describe(): string
    {
        return `Octane | Octane-Renderer | Pixijs ${PIXI_VERSION}`;
    }

    /** The banner's console arguments: the text with its style marks, then one style per mark. */
    public static banner(): string[]
    {
        return [
            `\n%c   Octane  %c|%c  Octane-Renderer  %c|%c  Pixijs  %c  ${PIXI_VERSION}  %c\n`,
            `${BAR_NAME} border-radius: 6px 0 0 6px;`,
            BAR_DIVIDER,
            BAR_NAME,
            BAR_DIVIDER,
            BAR_NAME,
            BAR_VERSION,
            'background: transparent;'
        ];
    }

    public static sayHello(): void
    {
        if(!self.console) return;

        // Chromium and Firefox draw the styled bar; anything else gets the plain line.
        if(/chrome|chromium|firefox/i.test(navigator.userAgent)) self.console.log(...OctaneVersion.banner());
        else self.console.log(OctaneVersion.describe());
    }
}

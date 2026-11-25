import { GetAvatarRenderManager } from '@octane/avatar';
import { GetTickerTime } from '@octane/utils';

/**
 * Time the room may spend each frame on mouth and eye frames of avatars that do not walk. When a
 * crowd talks and blinks at once, those avatars take turns by object id instead of slowing the
 * frame down. Walking, turning, posture and zoom changes never wait.
 *
 * Ported from plus-emulator/volt-renderer (AvatarCompositeBudget, by Dennis, GPL-3.0). A redraw is charged
 * what the avatar's own compositing took, plus its share of the atlas flush while the atlas is on.
 */
export class AvatarCompositeBudget
{
    // room.avatar.redraw.budget: off, every avatar redraws at once, on or off screen, as before.
    public static ENABLED: boolean = true;

    private static TARGET_MS: number = 4;
    private static MIN_COMPOSITES: number = 32;
    private static MAX_COMPOSITES: number = 4096;
    // A flush costs a fixed amount per atlas page plus a little per avatar; only the per-avatar part
    // is charged to each redraw, from flushes big enough to tell the two apart.
    private static MIN_FLUSH_SAMPLE: number = 32;

    private static _frameTime: number = -1;
    private static _frame: number = 0;
    private static _spentMs: number = 0;
    private static _composites: number = 0;
    private static _demand: number = 0;
    private static _used: number = 0;
    private static _share: number = AvatarCompositeBudget.MAX_COMPOSITES;
    private static _turns: number = 1;
    private static _prepareMs: number = 0.05;
    private static _flushMs: number = 0.01;

    private static beginFrame(): void
    {
        const time = GetTickerTime();

        if(time === this._frameTime) return;

        if(this._composites > 0) this._prepareMs += (((this._spentMs / this._composites) - this._prepareMs) * 0.2);

        // The atlas is drawn after the room update, so the last flush belongs to the last frame.
        const manager = GetAvatarRenderManager();
        const flushJobs = manager.lastCompositionFlushJobs;

        if(flushJobs >= this.MIN_FLUSH_SAMPLE) this._flushMs += (((manager.lastCompositionFlushMs / flushJobs) - this._flushMs) * 0.2);

        // Without the atlas nothing is flushed, so a redraw costs only its own compositing.
        this._share = AvatarCompositeBudget.shareFor(this._prepareMs + (manager.atlasEnabled ? this._flushMs : 0));
        this._turns = Math.max(1, Math.ceil(this._demand / this._share));
        this._demand = 0;
        this._used = 0;
        this._spentMs = 0;
        this._composites = 0;
        this._frame++;
        this._frameTime = time;
    }

    // How many cosmetic redraws fit in a frame when one costs this long.
    public static shareFor(costMs: number): number
    {
        return Math.max(this.MIN_COMPOSITES, Math.min(this.MAX_COMPOSITES, Math.floor(this.TARGET_MS / Math.max(costMs, 0.001))));
    }

    // Whether the avatar with this id may redraw its mouth or eyes in this frame.
    public static allow(phase: number): boolean
    {
        if(!this.ENABLED) return true;

        this.beginFrame();

        this._demand++;

        const turns = this._turns;

        if((turns > 1) && (((this._frame + phase) % turns) !== 0)) return false;
        if(this._used >= this._share) return false;

        this._used++;

        return true;
    }

    public static record(ms: number): void
    {
        if(!this.ENABLED) return;

        this.beginFrame();

        this._spentMs += ms;
        this._composites++;
    }

    // For tests: forget what earlier frames measured.
    public static reset(): void
    {
        this._frameTime = -1;
        this._frame = 0;
        this._spentMs = 0;
        this._composites = 0;
        this._demand = 0;
        this._used = 0;
        this._share = this.MAX_COMPOSITES;
        this._turns = 1;
        this._prepareMs = 0.05;
        this._flushMs = 0.01;
    }
}

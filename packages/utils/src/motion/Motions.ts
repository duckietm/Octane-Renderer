import { GetTickerFPS } from '../GetTickerFPS';
import { GetTickerTime } from '../GetTickerTime';
import { Motion } from './Motion';

export class Motions
{
    private static _QUEUED_MOTIONS: Motion[] = [];
    private static _RUNNING_MOTIONS: Motion[] = [];
    private static _REMOVED_MOTIONS: Motion[] = [];
    private static _TIMER: ReturnType<typeof setInterval> = null;
    private static _IS_UPDATING: boolean = false;
    private static _VISIBILITY_WATCHED: boolean = false;

    public static get TIMER_TIME(): number
    {
        return (1000 / GetTickerFPS());
    }

    public static runMotion(motion: Motion): Motion
    {
        if(((Motions._RUNNING_MOTIONS.indexOf(motion) === -1) && (Motions._QUEUED_MOTIONS.indexOf(motion) === -1)))
        {
            if(Motions._IS_UPDATING)
            {
                Motions._QUEUED_MOTIONS.push(motion);
            }
            else
            {
                Motions._RUNNING_MOTIONS.push(motion);

                motion.start();
            }

            Motions.startTimer();
        }

        return motion;
    }

    public static removeMotion(motion: Motion): void
    {
        let index: number = Motions._RUNNING_MOTIONS.indexOf(motion);

        if(index > -1)
        {
            if(Motions._IS_UPDATING)
            {
                index = Motions._REMOVED_MOTIONS.indexOf(motion);

                if(index == -1) Motions._REMOVED_MOTIONS.push(motion);
            }
            else
            {
                Motions._RUNNING_MOTIONS.splice(index, 1);

                if(motion.running) motion.stop();

                if(!Motions._RUNNING_MOTIONS.length) Motions.stopTimer();
            }
        }
        else
        {
            index = Motions._QUEUED_MOTIONS.indexOf(motion);

            if(index > -1) Motions._QUEUED_MOTIONS.splice(index, 1);
        }
    }

    public static getMotionByTag(tag: string): Motion
    {
        for(const motion of Motions._RUNNING_MOTIONS)
        {
            if(motion.tag == tag) return motion;
        }

        for(const motion of Motions._QUEUED_MOTIONS)
        {
            if(motion.tag == tag) return motion;
        }

        return null;
    }

    public static getMotionByTarget(target: HTMLElement): Motion
    {
        for(const motion of Motions._RUNNING_MOTIONS)
        {
            if(motion.target == target) return motion;
        }

        for(const motion of Motions._QUEUED_MOTIONS)
        {
            if(motion.target == target) return motion;
        }

        return null;
    }

    public static getMotionByTagAndTarget(tag: string, target: HTMLElement): Motion
    {
        for(const motion of Motions._RUNNING_MOTIONS)
        {
            if(((motion.tag == tag) && (motion.target == target))) return motion;
        }

        for(const motion of Motions._QUEUED_MOTIONS)
        {
            if(((motion.tag == tag) && (motion.target == target))) return motion;
        }

        return null;
    }

    public static get isRunning(): boolean
    {
        return !!Motions._TIMER;
    }

    public static get isUpdating(): boolean
    {
        return Motions._IS_UPDATING;
    }

    private static onTick(): void
    {
        Motions._IS_UPDATING = true;

        const time: number = GetTickerTime();

        let motion: Motion = null;

        // eslint-disable-next-line no-cond-assign
        while(motion = Motions._QUEUED_MOTIONS.pop()) Motions._RUNNING_MOTIONS.push(motion);

        // eslint-disable-next-line no-cond-assign
        while(motion = Motions._REMOVED_MOTIONS.pop())
        {
            // A motion removed by hand after it was queued here is already out of the list; splice(-1, 1)
            // would take the last running motion instead.
            const index = Motions._RUNNING_MOTIONS.indexOf(motion);

            if(index > -1) Motions._RUNNING_MOTIONS.splice(index, 1);

            if(motion.running) motion.stop();
        }

        for(motion of Motions._RUNNING_MOTIONS)
        {
            if(motion.running)
            {
                motion.tick(time);

                if(motion.complete)
                {
                    Motions.removeMotion(motion);
                }
            }
            else
            {
                Motions.removeMotion(motion);
            }
        }

        if(!Motions._RUNNING_MOTIONS.length) Motions.stopTimer();

        Motions._IS_UPDATING = false;
    }

    private static startTimer(): void
    {
        Motions.watchVisibility();

        if(!Motions._TIMER && !Motions.isHidden)
        {
            Motions._TIMER = setInterval(() => Motions.onTick(), Motions.TIMER_TIME);
        }
    }

    private static stopTimer(): void
    {
        if(Motions._TIMER)
        {
            clearInterval(Motions._TIMER);

            Motions._TIMER = null;
        }
    }

    private static get isHidden(): boolean
    {
        return ((typeof document !== 'undefined') && document.hidden);
    }

    // The ticker clock the motions read from freezes in a hidden tab, so the
    // interval would only burn wakeups; park it and resume with the tab.
    private static watchVisibility(): void
    {
        if(Motions._VISIBILITY_WATCHED || (typeof document === 'undefined')) return;

        Motions._VISIBILITY_WATCHED = true;

        document.addEventListener('visibilitychange', () =>
        {
            if(Motions.isHidden) Motions.stopTimer();
            else if(Motions._RUNNING_MOTIONS.length || Motions._QUEUED_MOTIONS.length) Motions.startTimer();
        });
    }


    public getNumRunningMotions(target: HTMLElement): number
    {
        let count = 0;

        for(const motion of Motions._RUNNING_MOTIONS)
        {
            if(motion.target === target) count++;
        }

        return count;
    }
}

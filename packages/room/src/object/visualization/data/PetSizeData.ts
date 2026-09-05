import { IAssetGesture, IAssetPosture } from '@octane/api';
import { AnimationSizeData } from './AnimationSizeData';

export class PetSizeData extends AnimationSizeData
{
    public static DEFAULT: number = -1;

    private _posturesToAnimations: Map<string, number> = new Map();
    private _gesturesToAnimations: Map<string, number> = new Map();
    private _defaultPosture: string = null;

    public processPostures(postures: { defaultPosture?: string, postures: IAssetPosture[] }): boolean
    {
        if(!postures) return false;

        if(postures.defaultPosture && postures.defaultPosture.length) this._defaultPosture = postures.defaultPosture;

        if(!postures.postures) return false;

        for(const posture of postures.postures)
        {
            if(this._posturesToAnimations.get(posture.id)) continue;

            if(this._defaultPosture === null) this._defaultPosture = posture.id;

            this._posturesToAnimations.set(posture.id, posture.animationId);
        }

        if(this._posturesToAnimations.get(this._defaultPosture) === undefined) return false;

        return true;
    }

    public processGestures(gestures: IAssetGesture[]): boolean
    {
        if(!gestures) return false;

        for(const gesture of gestures)
        {
            if(this._gesturesToAnimations.get(gesture.id)) continue;

            this._gesturesToAnimations.set(gesture.id, gesture.animationId);
        }

        return true;
    }

    public postureToAnimation(posture: string): number
    {
        if(!this._posturesToAnimations.get(posture)) posture = this._defaultPosture;

        return this._posturesToAnimations.get(posture);
    }

    public getGestureDisabled(gesture: string): boolean
    {
        if(gesture === 'ded') return true;

        return false;
    }

    public gestureToAnimation(gesture: string): number
    {
        if(!this._gesturesToAnimations.get(gesture)) return PetSizeData.DEFAULT;

        return this._gesturesToAnimations.get(gesture);
    }

    public animationToPosture(animationIndex: number, useDefault: boolean): string
    {
        if((animationIndex >= 0) && (animationIndex < this._posturesToAnimations.size))
        {
            const keys = this._posturesToAnimations.keys();

            for(; ;)
            {
                const key = keys.next();

                if(key.done) return null;

                if(animationIndex <= 0) return key.value;

                --animationIndex;
            }
        }

        return (useDefault) ? this._defaultPosture : null;
    }

    public animationToGesture(index: number): string
    {
        if((index >= 0) && (index < this._gesturesToAnimations.size))
        {
            const keys = this._gesturesToAnimations.keys();

            for(; ;)
            {
                const key = keys.next();

                if(key.done) return null;

                if(index <= 0) return key.value;

                --index;
            }
        }

        return null;
    }

    public getGestureForAnimationId(animationId: number): string
    {
        for(const gesture of this._gesturesToAnimations.keys())
        {
            if(this._gesturesToAnimations.get(gesture) === animationId) return gesture;
        }

        return null;
    }

    public get totalPostures(): number
    {
        return this._posturesToAnimations.size;
    }

    public get totalGestures(): number
    {
        return this._gesturesToAnimations.size;
    }
}

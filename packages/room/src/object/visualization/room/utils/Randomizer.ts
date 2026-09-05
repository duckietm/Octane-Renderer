import { ToInt32 } from '@octane/utils';

export class Randomizer
{
    public static DEFAULT_SEED: number = 1;
    public static DEFAULT_MODULUS: number = 16777216;

    private static _randomizer:Randomizer = null;

    private _seed: number = 1;
    private _modulus: number = 16777216;
    private _multiplier: number = 69069;
    private _increment: number = 5;

    public static setSeed(seed: number = 1): void
    {
        if(!Randomizer._randomizer) Randomizer._randomizer = new Randomizer();

        Randomizer._randomizer.seed = seed;
    }

    public static setModulus(modulus: number = 16777216): void
    {
        if(!Randomizer._randomizer) Randomizer._randomizer = new Randomizer();

        Randomizer._randomizer.modulus = modulus;
    }

    public static getValues(count: number, min: number, max: number): number[]
    {
        if(!Randomizer._randomizer) Randomizer._randomizer = new Randomizer();

        return Randomizer._randomizer.getRandomValues(count, min, max);
    }

    public static getArray(count: number, maxValue: number): number[]
    {
        if(!Randomizer._randomizer) Randomizer._randomizer = new Randomizer();

        return Randomizer._randomizer.getRandomArray(count, maxValue);
    }

    public set seed(value: number)
    {
        this._seed = value;
    }

    public set modulus(value: number)
    {
        if(value < 1) value = 1;

        this._modulus = value;
    }

    public dispose(): void
    {
    }

    public getRandomValues(count: number, min: number, max: number): number[]
    {
        const values: number[] = [];

        let index = 0;

        while(index < count)
        {
            values.push(this.iterateScaled(min, (max - min)));
            index++;
        }

        return values;
    }

    public getRandomArray(count: number, maxValue: number): number[]
    {
        if(((count > maxValue) || (maxValue > 1000))) return null;

        const pool: number[] = [];

        let poolIndex = 0;

        while(poolIndex <= maxValue)
        {
            pool.push(poolIndex);
            poolIndex++;
        }

        const result: number[] = [];

        let pickIndex = 0;

        while(pickIndex < count)
        {
            const randomIndex = this.iterateScaled(0, (pool.length - 1));

            result.push(pool[randomIndex]);
            pool.splice(randomIndex, 1);

            pickIndex++;
        }

        return result;
    }

    private iterate(): number
    {
        let value: number = ToInt32(Math.trunc(this._multiplier * this._seed) + this._increment);

        if(value < 0) value = -(value);

        value = (value % this._modulus);

        this._seed = value;

        return value;
    }

    private iterateScaled(base: number, range: number): number
    {
        let value: number = this.iterate();

        if(range < 1) return base;

        value = Math.trunc(base + ((value / this._modulus) * range));

        return value;
    }
}

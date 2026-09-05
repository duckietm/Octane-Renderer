import { IRoomPetData } from '@octane/api';

export class RoomPetData implements IRoomPetData
{
    private _id: number;
    private _level: number;
    private _maximumLevel: number;
    private _experience: number;
    private _levelExperienceGoal: number;
    private _energy: number;
    private _maximumEnergy: number;
    private _happyness: number;
    private _maximumHappyness: number;
    private _ownerId: number;
    private _ownerName: string;
    private _respect: number;
    private _age: number;
    private _unknownRarity: number;
    private _saddle: boolean;
    private _rider: boolean;
    private _breedable: boolean;
    private _skillThresholds: number[];
    private _publiclyRideable: number;
    private _fullyGrown: boolean;
    private _dead: boolean;
    private _maximumTimeToLive: number;
    private _remainingTimeToLive: number;
    private _remainingGrowTime: number;
    private _rarityLevel: number;
    private _publiclyBreedable: boolean;
    private _adultLevel: number = 7;

    public get id(): number
    {
        return this._id;
    }

    public set id(value: number)
    {
        this._id = value;
    }

    public get level(): number
    {
        return this._level;
    }

    public set level(level: number)
    {
        this._level = level;
    }

    public get maximumLevel(): number
    {
        return this._maximumLevel;
    }

    public set maximumLevel(value: number)
    {
        this._maximumLevel = value;
    }

    public get experience(): number
    {
        return this._experience;
    }

    public set experience(experience: number)
    {
        this._experience = experience;
    }

    public get levelExperienceGoal(): number
    {
        return this._levelExperienceGoal;
    }

    public set levelExperienceGoal(value: number)
    {
        this._levelExperienceGoal = value;
    }

    public get energy(): number
    {
        return this._energy;
    }

    public set energy(energy: number)
    {
        this._energy = energy;
    }

    public get maximumEnergy(): number
    {
        return this._maximumEnergy;
    }

    public set maximumEnergy(value: number)
    {
        this._maximumEnergy = value;
    }

    public get happyness(): number
    {
        return this._happyness;
    }

    public set happyness(value: number)
    {
        this._happyness = value;
    }

    public get maximumHappyness(): number
    {
        return this._maximumHappyness;
    }

    public set maximumHappyness(value: number)
    {
        this._maximumHappyness = value;
    }

    public get ownerId(): number
    {
        return this._ownerId;
    }

    public set ownerId(value: number)
    {
        this._ownerId = value;
    }

    public get ownerName(): string
    {
        return this._ownerName;
    }

    public set ownerName(ownerName: string)
    {
        this._ownerName = ownerName;
    }

    public get respect(): number
    {
        return this._respect;
    }

    public set respect(value: number)
    {
        this._respect = value;
    }

    public get age(): number
    {
        return this._age;
    }

    public set age(age: number)
    {
        this._age = age;
    }

    public get unknownRarity(): number
    {
        return this._unknownRarity;
    }

    public set unknownRarity(value: number)
    {
        this._unknownRarity = value;
    }

    public get saddle(): boolean
    {
        return this._saddle;
    }

    public set saddle(value: boolean)
    {
        this._saddle = value;
    }

    public get rider(): boolean
    {
        return this._rider;
    }

    public set rider(value: boolean)
    {
        this._rider = value;
    }

    public get skillTresholds(): number[]
    {
        return this._skillThresholds;
    }

    public set skillTresholds(value: number[])
    {
        this._skillThresholds = value;
    }

    public get publiclyRideable(): number
    {
        return this._publiclyRideable;
    }

    public set publiclyRideable(value: number)
    {
        this._publiclyRideable = value;
    }

    public get breedable(): boolean
    {
        return this._breedable;
    }

    public set breedable(value: boolean)
    {
        this._breedable = value;
    }

    public get fullyGrown(): boolean
    {
        return this._fullyGrown;
    }

    public set fullyGrown(value: boolean)
    {
        this._fullyGrown = value;
    }

    public get dead(): boolean
    {
        return this._dead;
    }

    public set dead(value: boolean)
    {
        this._dead = value;
    }

    public get rarityLevel(): number
    {
        return this._rarityLevel;
    }

    public set rarityLevel(rarityLevel: number)
    {
        this._rarityLevel = rarityLevel;
    }

    public get maximumTimeToLive(): number
    {
        return this._maximumTimeToLive;
    }

    public set maximumTimeToLive(value: number)
    {
        this._maximumTimeToLive = value;
    }

    public get remainingTimeToLive(): number
    {
        return this._remainingTimeToLive;
    }

    public set remainingTimeToLive(value: number)
    {
        this._remainingTimeToLive = value;
    }

    public get remainingGrowTime(): number
    {
        return this._remainingGrowTime;
    }

    public set remainingGrowTime(value: number)
    {
        this._remainingGrowTime = value;
    }

    public get publiclyBreedable(): boolean
    {
        return this._publiclyBreedable;
    }

    public set publiclyBreedable(value: boolean)
    {
        this._publiclyBreedable = value;
    }

    public get adultLevel(): number
    {
        return this._adultLevel;
    }
}

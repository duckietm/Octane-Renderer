export interface ISoundboardPlayOptions
{
    /**
     * Pads sharing a group cut each other off: playing one stops the ones still
     * sounding from the same group. Pads without a group only compete for the
     * channel's voices.
     */
    group?: string;

    /**
     * Level of this pad relative to the player's soundboard volume, from 0 to 1.
     * Lets a loud clip be tamed without touching the file. Defaults to 1.
     */
    gain?: number;
}

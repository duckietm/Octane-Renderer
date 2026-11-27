import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../codec/evawire/EvaWireDataWrapper';
import { OpenPetPackageRequestedMessageParser } from './OpenPetPackageRequestedMessageParser';

const packet = (...fields: (number | string)[]): EvaWireDataWrapper =>
{
    const bytes: number[] = [];

    for(const field of fields)
    {
        if(typeof field === 'number')
        {
            bytes.push((field >>> 24) & 0xff, (field >>> 16) & 0xff, (field >>> 8) & 0xff, field & 0xff);
        }
        else
        {
            const encoded = new TextEncoder().encode(field);

            bytes.push((encoded.length >>> 8) & 0xff, encoded.length & 0xff, ...encoded);
        }
    }

    return new EvaWireDataWrapper(0, new BinaryReader(Uint8Array.from(bytes).buffer));
};

describe('OpenPetPackageRequestedMessageParser', () =>
{
    it('reads the packaged pet as the official client does', () =>
    {
        const parser = new OpenPetPackageRequestedMessageParser();

        parser.parse(packet(77, 15, 3, 'FF8800', 0, 0));

        expect(parser.objectId).toBe(77);
        expect(parser.figureData.typeId).toBe(15);
        expect(parser.figureData.paletteId).toBe(3);
        expect(parser.figureData.color).toBe(0xff8800);
    });

    it('reads the custom parts of a pet that has them', () =>
    {
        const parser = new OpenPetPackageRequestedMessageParser();

        parser.parse(packet(77, 15, 3, 'FF8800', 0, 1, 2, 4, 5));

        expect(parser.figureData.customParts).toHaveLength(1);
    });

    it('has no pet when the package holds any pet of its type', () =>
    {
        const parser = new OpenPetPackageRequestedMessageParser();

        parser.flush();
        parser.parse(packet(77));

        expect(parser.objectId).toBe(77);
        expect(parser.figureData).toBeNull();
    });
});

import { describe, expect, it } from 'vitest';
import { AvatarModelGeometry } from '../geometry';
import { HabboAvatarAnimations } from './HabboAvatarAnimations';
import { HabboAvatarGeometry } from './HabboAvatarGeometry';
import { HabboAvatarPartSets } from './HabboAvatarPartSets';

const activeSet = (id: string) => HabboAvatarPartSets.partSets.activePartSets.find(set => set.id === id)?.activeParts.map(part => part.setType);
const animation = (id: string) => HabboAvatarAnimations.animations.find(action => action.id === id);
const frames = (id: string, setType: string) => animation(id)?.parts.find(part => part.setType === setType)?.frames.map(frame => frame.assetPartDefinition);

/**
 * The avatar part sets, action animations and geometry follow AIR's HabboAvatarPartSets, HabboAvatarAnimation and
 * HabboAvatarGeometry: misc items (mc, mcl, mcr, mco, mcu) and shoulder pets (pt, ptl, ptr) have their own layers
 * and take part in the actions, so they follow the hand and the walk instead of staying in their standing frame.
 */
describe('avatar data follows AIR', () =>
{
    it('lists every part once, with the over and under layers of misc items', () =>
    {
        const types = HabboAvatarPartSets.partSets.partSet.map(part => part.setType);

        expect(new Set(types).size).toBe(types.length);
        expect(types).toEqual(expect.arrayContaining([ 'mc', 'mcl', 'mcr', 'mco', 'mcu', 'pt', 'ptl', 'ptr' ]));
    });

    it('has the pet and misc part sets, and lets the walk and the sit take pets and misc items along', () =>
    {
        expect(activeSet('pet')).toEqual([ 'pt', 'ptr', 'ptl' ]);
        expect(activeSet('misc')).toEqual([ 'mc', 'mcr', 'mcl', 'mco', 'mcu' ]);
        expect(activeSet('walk')).toEqual(expect.arrayContaining([ 'mcl', 'mcr', 'ptl', 'ptr', 'mc', 'mco', 'mcu', 'ha', 'he' ]));
        expect(activeSet('sit')).toEqual(expect.arrayContaining([ 'pt', 'ptr', 'ptl', 'mc', 'mco', 'mcu' ]));
        expect(activeSet('handRight')).toContain('mcr');
        expect(activeSet('handLeft')).toContain('mcl');
    });

    it('moves an item in the hand with the hand', () =>
    {
        // Blow a kiss raises the right hand to the mouth; the item in it goes along on its drink frames.
        expect(frames('Blow', 'mcr')).toEqual([ 'drk' ]);
        expect(frames('Sign', 'mcl')).toEqual([ 'wav' ]);
        expect(frames('Respect', 'mcl')).toEqual([ 'wav', 'wav' ]);
        // Blow and Laugh leave the pet and the body item alone.
        expect(animation('Blow').parts.map(part => part.setType)).not.toContain('pt');
        expect(animation('Laugh').parts.map(part => part.setType)).not.toContain('mc');
    });

    it('uses the sit frames of sleeves and hats, and has a Sleep action', () =>
    {
        expect(frames('Sit', 'ls')).toEqual(Array(8).fill('sit'));
        expect(frames('Sit', 'ha')).toEqual(Array(8).fill('sit'));
        expect(animation('Sleep')).toBeTruthy();
    });

    it('draws the over layer in front of everything, the under layer behind the body, and a pet arm layer with its arm', () =>
    {
        const geometry = new AvatarModelGeometry(HabboAvatarGeometry.geometry);

        for(const type of [ 'vertical', 'sitting', 'horizontal' ])
        {
            for(const angle of [ 0, 45, 90, 135, 180, 225, 270, 315 ])
            {
                // Front to back, as the avatar image reads it from the end.
                const order = geometry.getBodyPartsAtAngle('full', angle, type);

                expect(order[0]).toBe('top');
                // The under layer is behind the body and the head (the far arm can be further back still).
                expect(order.indexOf('bottom')).toBeGreaterThan(order.indexOf('torso'));
                expect(order.indexOf('bottom')).toBeGreaterThan(order.indexOf('head'));
                expect(order.indexOf('petl')).toBe(order.indexOf('leftarm') - 1);
                expect(order.indexOf('petr')).toBe(order.indexOf('rightarm') - 1);
            }
        }

        expect(geometry.getBodyPartOfItem('vertical', 'mco', null).id).toBe('top');
        expect(geometry.getBodyPartOfItem('vertical', 'mcu', null).id).toBe('bottom');
        expect(geometry.getBodyPartOfItem('vertical', 'ptl', null).id).toBe('petl');
        expect(geometry.getBodyPartOfItem('vertical', 'mcr', null).id).toBe('rightarm');
    });
});

import { AvatarAction } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { AvatarActionManager } from './AvatarActionManager';
import { getMissingBundledActions } from './BundledAvatarActions';

// The states of the HabboAvatarActions.json hotels ship: no cry, vote, typing or SnowStorm action.
const HOTEL_STATES = [ 'lay', 'float', 'swim', 'sit', 'sb360', 'sbollie', 'sbup', 'sbsq', 'ridejump', 'respect', 'wave', 'sign', 'blow', 'laugh', 'idle', 'fx', 'dance', 'usei', 'cri', 'talk', 'gest', 'sml', 'sad', 'agr', 'srp', 'sleep', 'mv', 'std' ];
const hotelActions = () => ({ actions: HOTEL_STATES.map(state => ({ id: state, state, precedence: 100, prevents: [], animation: false })) });

describe('bundled avatar actions', () =>
{
    it('fills in the postures the hotel actions lack', () =>
    {
        const states = getMissingBundledActions(hotelActions()).actions.map(action => action.state).sort();

        expect(states).toEqual([ 'cry', 'swdieback', 'swdiefront', 'swpick', 'swrun', 'swthrow', 'typing', 'vote' ]);
    });

    it('leaves a state the hotel defines to the hotel, whatever its case', () =>
    {
        const loaded = { actions: [ ...hotelActions().actions, { state: 'SWRUN' } ] };

        expect(getMissingBundledActions(loaded).actions.map(action => action.state)).not.toContain('swrun');
    });

    it('lets the action manager find the SnowStorm and expression postures after the hotel actions', () =>
    {
        const loaded = hotelActions();
        const manager = new AvatarActionManager(null, loaded);

        expect(manager.getActionDefinitionWithState(AvatarAction.SNOWWAR_RUN)).toBeFalsy();

        manager.updateActions(getMissingBundledActions(loaded));

        for(const state of [ AvatarAction.SNOWWAR_RUN, AvatarAction.SNOWWAR_THROW, AvatarAction.SNOWWAR_PICK, AvatarAction.SNOWWAR_DIE_FRONT, AvatarAction.SNOWWAR_DIE_BACK, AvatarAction.EXPRESSION_CRY, AvatarAction.TYPING, AvatarAction.VOTE ])
        {
            expect(manager.getActionDefinitionWithState(state)?.state).toBe(state);
        }

        expect(manager.getActionDefinitionWithState('lay')?.id).toBe('lay');
    });
});

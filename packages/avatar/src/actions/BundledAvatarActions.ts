import { HabboAvatarActions } from '../data/HabboAvatarActions';

/**
 * The actions bundled with the renderer that the hotel's HabboAvatarActions.json does not define, matched by
 * state without case. The JSON most hotels ship comes from an older HabboAvatarActions.xml and has no cry, vote,
 * typing or SnowStorm (swrun, swthrow, swpick, swdiefront, swdieback) action, so those postures were never drawn.
 * A state the hotel defines keeps the hotel's definition.
 */
export const getMissingBundledActions = (loaded: { actions?: { state?: string }[] }): { actions: typeof HabboAvatarActions.actions } =>
{
    const states = new Set((loaded?.actions ?? []).map(action => String(action?.state ?? '').toLowerCase()));

    return { actions: HabboAvatarActions.actions.filter(action => !states.has(action.state.toLowerCase())) };
};

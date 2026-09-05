import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredTradeRule, readWiredTradeRule } from './WiredTradeRuleParser';

export const WIRED_CONTRACT_PAYMENT = 0;
export const WIRED_CONTRACT_TRADE = 1;
export const WIRED_CONTRACT_REWARD = 2;

/**
 * A wired contract wants something from the player, and opens the negotiation. Wire layout:
 * int contractType, string rewardText, string layoutType,
 * bool showRequirementsImmediate, bool overridePreviousTrade, int timeoutSeconds,
 * int ruleCount, [rule]*, bool hasRewardRule, [rule].
 *
 * overridePreviousTrade says this replaces a negotiation already open rather than being a second
 * one: a player only ever has one, so the window swaps instead of stacking.
 */
export class WiredTradeOpenMessageParser implements IMessageParser
{
    private _contractType: number = WIRED_CONTRACT_PAYMENT;
    private _rewardText: string = '';
    private _layoutType: string = '';
    private _showRequirementsImmediate: boolean = false;
    private _overridePreviousTrade: boolean = false;
    private _timeoutSeconds: number = 0;
    private _giveRules: IWiredTradeRule[] = [];
    private _rewardRule: IWiredTradeRule = null;

    public flush(): boolean
    {
        this._contractType = WIRED_CONTRACT_PAYMENT;
        this._rewardText = '';
        this._layoutType = '';
        this._showRequirementsImmediate = false;
        this._overridePreviousTrade = false;
        this._timeoutSeconds = 0;
        this._giveRules = [];
        this._rewardRule = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._contractType = wrapper.readInt();
        this._rewardText = wrapper.readString();
        this._layoutType = wrapper.readString();
        this._showRequirementsImmediate = wrapper.readBoolean();
        this._overridePreviousTrade = wrapper.readBoolean();
        this._timeoutSeconds = wrapper.readInt();

        this._giveRules = [];

        const ruleCount = wrapper.readInt();

        for(let i = 0; i < ruleCount; i++) this._giveRules.push(readWiredTradeRule(wrapper));

        this._rewardRule = wrapper.readBoolean() ? readWiredTradeRule(wrapper) : null;

        return true;
    }

    public get contractType(): number
    {
        return this._contractType;
    }
    public get rewardText(): string
    {
        return this._rewardText;
    }
    public get layoutType(): string
    {
        return this._layoutType;
    }
    public get showRequirementsImmediate(): boolean
    {
        return this._showRequirementsImmediate;
    }
    public get overridePreviousTrade(): boolean
    {
        return this._overridePreviousTrade;
    }
    public get timeoutSeconds(): number
    {
        return this._timeoutSeconds;
    }
    public get giveRules(): IWiredTradeRule[]
    {
        return this._giveRules;
    }
    public get rewardRule(): IWiredTradeRule
    {
        return this._rewardRule;
    }
}

import { IMessageDataWrapper } from '@nitrots/api';

export const WIRED_TRADE_NODE_CURRENCY = 0;
export const WIRED_TRADE_NODE_FURNI = 1;

/** One thing a contract asks for or hands back: a pile of coins, or a pile of one kind of furni. */
export interface IWiredTradeNode
{
    kind: number;
    currencyType: number;
    wallItem: boolean;
    spriteId: number;
    amount: number;
}

/**
 * Nodes inside a rule are joined: all of them have to be met. Rules are alternatives: any one of
 * them will do. The requirements bubble renders that as `&` inside a rule and `or` between them.
 */
export interface IWiredTradeRule
{
    nodes: IWiredTradeNode[];
}

/**
 * A node is a fixed-width row -- both kinds carry every field -- so the reader never has to branch
 * mid-message to know how much is left.
 */
export const readWiredTradeNode = (wrapper: IMessageDataWrapper): IWiredTradeNode =>
{
    const kind = wrapper.readInt();
    const currencyType = wrapper.readInt();
    const wallItem = wrapper.readBoolean();
    const spriteId = wrapper.readInt();
    const amount = wrapper.readInt();

    return { kind, currencyType, wallItem, spriteId, amount };
};

export const readWiredTradeRule = (wrapper: IMessageDataWrapper): IWiredTradeRule =>
{
    const nodes: IWiredTradeNode[] = [];
    const count = wrapper.readInt();

    for(let i = 0; i < count; i++) nodes.push(readWiredTradeNode(wrapper));

    return { nodes };
};

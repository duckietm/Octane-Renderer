import { IMessageComposer } from '@octane/api';
import { Byte } from '../../../codec/Byte';
import { Short } from '../../../codec/Short';
import { IWiredContractContents, IWiredContractRule, WIRED_CONTRACT_NODE_FURNI, WIRED_CONTRACT_TYPE_PAYMENT, WIRED_CONTRACT_TYPE_REWARD } from '../../parser/roomevents/WiredContractData';

/**
 * AIR AbstractContract.addContentsToComposer: contract id, SHORT type, TradeRequirementRulesDefinition (byte node
 * types, furni nodes with their ChestItemType), then PaymentContract (SHORT mode, receive text, layout) or
 * RewardContract (SHORT earnings category, show by default, reward text) options.
 */
export class UpdateWiredContractComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(contents: IWiredContractContents)
    {
        const data: unknown[] = [ contents.contractId, new Short(contents.contractType) ];
        const writeRule = (rule: IWiredContractRule) =>
        {
            data.push(rule.nodes.length);

            for(const node of rule.nodes)
            {
                data.push(new Byte(node.type), node.amount);

                if(node.type !== WIRED_CONTRACT_NODE_FURNI) continue;

                if(!node.itemType) throw new Error('A furni contract node needs an item type');

                data.push(node.itemType.isWallItem, node.itemType.typeId, node.itemType.legacyPosterId ?? '');
            }
        };
        const give = contents.definition.youGiveRule;
        const get = contents.definition.youGetRule;

        data.push(give !== null);

        if(give !== null)
        {
            data.push(give.length);
            give.forEach(writeRule);
        }

        data.push(get !== null);

        if(get !== null) writeRule(get);

        if(contents.contractType === WIRED_CONTRACT_TYPE_PAYMENT) data.push(new Short(contents.paymentMode), contents.receiveText, contents.layoutType);

        if(contents.contractType === WIRED_CONTRACT_TYPE_REWARD) data.push(new Short(contents.rewardCategory), contents.showDialog, contents.rewardText);

        this._data = data;
    }

    public getMessageArray(): unknown[]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

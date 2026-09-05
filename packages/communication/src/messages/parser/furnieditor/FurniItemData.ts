import { IMessageDataWrapper } from '@octane/api';

export class FurniItemData
{
    public id: number;
    public spriteId: number;
    public itemName: string;
    public publicName: string;
    public type: string;
    public width: number;
    public length: number;
    public stackHeight: number;
    public allowStack: boolean;
    public allowWalk: boolean;
    public allowSit: boolean;
    public allowLay: boolean;
    public interactionType: string;
    public interactionModesCount: number;

    public parse(wrapper: IMessageDataWrapper): void
    {
        this.id = wrapper.readInt();
        this.spriteId = wrapper.readInt();
        this.itemName = wrapper.readString();
        this.publicName = wrapper.readString();
        this.type = wrapper.readString();
        this.width = wrapper.readInt();
        this.length = wrapper.readInt();
        this.stackHeight = wrapper.readDouble();
        this.allowStack = wrapper.readBoolean();
        this.allowWalk = wrapper.readBoolean();
        this.allowSit = wrapper.readBoolean();
        this.allowLay = wrapper.readBoolean();
        this.interactionType = wrapper.readString();
        this.interactionModesCount = wrapper.readInt();
    }
}

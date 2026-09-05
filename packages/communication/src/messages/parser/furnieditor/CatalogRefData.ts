import { IMessageDataWrapper } from '@octane/api';

export class CatalogRefData
{
    public id: number;
    public catalogName: string;
    public costCredits: number;
    public costPoints: number;
    public pointsType: number;
    public pageId: number;
    public pageName: string;

    public parse(wrapper: IMessageDataWrapper): void
    {
        this.id = wrapper.readInt();
        this.catalogName = wrapper.readString();
        this.costCredits = wrapper.readInt();
        this.costPoints = wrapper.readInt();
        this.pointsType = wrapper.readInt();
        this.pageId = wrapper.readInt();
        this.pageName = wrapper.readString();
    }
}

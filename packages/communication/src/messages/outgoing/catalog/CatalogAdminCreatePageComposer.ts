import { IMessageComposer } from '@octane/api';

export class CatalogAdminCreatePageComposer implements IMessageComposer<ConstructorParameters<typeof CatalogAdminCreatePageComposer>>
{
    private _data: ConstructorParameters<typeof CatalogAdminCreatePageComposer>;

    constructor(caption: string, caption2: string, layout: string, iconType: number, minRank: number, visible: boolean, enabled: boolean, orderNum: number, parentId: number, targetCatalogType: string, catalogMode: string = 'NORMAL', iconColor: number = 1, clubOnly: boolean = false, vipOnly: boolean = false, pageHeadline: string = '', pageTeaser: string = '', pageSpecial: string = '', pageText1: string = '', pageText2: string = '', pageTextDetails: string = '', pageTextTeaser: string = '', roomId: number = 0, includes: string = '', draftVersionId: number = 0, expectedRevision: number = 0, lockToken: string = '', summary: string = '', operationId: string = '')
    {
        this._data = [ caption, caption2, layout, iconType, minRank, visible, enabled, orderNum, parentId, targetCatalogType, catalogMode, iconColor, clubOnly, vipOnly, pageHeadline, pageTeaser, pageSpecial, pageText1, pageText2, pageTextDetails, pageTextTeaser, roomId, includes, draftVersionId, expectedRevision, lockToken, summary, operationId ];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}

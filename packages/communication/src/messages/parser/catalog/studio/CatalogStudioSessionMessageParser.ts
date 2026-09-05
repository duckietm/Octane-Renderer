import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { ungzip } from 'pako';

const SNAPSHOT_ENCODING = 'GZIP_BASE64_JSON';
const MAX_PAGE_CHUNKS = 10_000;

const decodePageChunks = (chunks: string[]): CatalogStudioPageSnapshot[] =>
{
    if(!chunks.length) return [];

    const binary = atob(chunks.join(''));
    const bytes = new Uint8Array(binary.length);
    for(let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);

    return JSON.parse(new TextDecoder().decode(ungzip(bytes))) as CatalogStudioPageSnapshot[];
};

export interface CatalogStudioActor
{
    id: number;
    username: string;
}

export interface CatalogStudioPublishedVersion
{
    id: number;
    label: string;
    publishedAt: string;
}

export interface CatalogStudioPageSnapshot
{
    catalogType: 'NORMAL' | 'BUILDER';
    pageId: number;
    parentId: number;
    captionSave: string;
    caption: string;
    pageLayout: string;
    iconColor: number;
    iconImage: number;
    minRank: number;
    orderNum: number;
    visible: boolean;
    enabled: boolean;
    clubOnly: boolean;
    catalogMode: string;
    vipOnly: boolean;
    pageHeadline: string;
    pageTeaser: string;
    pageSpecial: string;
    pageText1: string;
    pageText2: string;
    pageTextDetails: string;
    pageTextTeaser: string;
    roomId: number;
    includes: string;
}

export interface CatalogStudioOfferSnapshot
{
    catalogType: 'NORMAL' | 'BUILDER';
    offerId: number;
    itemIds: string;
    pageId: number;
    catalogName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    amount: number;
    limitedStack: number;
    orderNumber: number;
    offerIdClient: number;
    songId: number;
    extradata: string;
    haveOffer: boolean;
    clubOnly: boolean;
}

export class CatalogStudioSessionMessageParser implements IMessageParser
{
    public activeVersionId = 0;
    public draftVersionId = 0;
    public revision = 0;
    public activeUpdatedAt = '';
    public draftCreatedAt = '';
    public pendingCount = 0;
    public actors: CatalogStudioActor[] = [];
    public validationCurrent = false;
    public validationIssueCount = 0;
    public publishedVersions: CatalogStudioPublishedVersion[] = [];
    public pages: CatalogStudioPageSnapshot[] = [];
    public offers: CatalogStudioOfferSnapshot[] = [];

    public flush(): boolean
    {
        this.activeVersionId = 0;
        this.draftVersionId = 0;
        this.revision = 0;
        this.activeUpdatedAt = '';
        this.draftCreatedAt = '';
        this.pendingCount = 0;
        this.actors = [];
        this.validationCurrent = false;
        this.validationIssueCount = 0;
        this.publishedVersions = [];
        this.pages = [];
        this.offers = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this.activeVersionId = wrapper.readInt();
        this.draftVersionId = wrapper.readInt();
        this.revision = wrapper.readInt();
        this.activeUpdatedAt = wrapper.readString();
        this.draftCreatedAt = wrapper.readString();
        this.pendingCount = wrapper.readInt();
        this.actors = Array.from({ length: wrapper.readInt() }, () => ({
            id: wrapper.readInt(), username: wrapper.readString()
        }));
        this.validationCurrent = wrapper.readBoolean();
        this.validationIssueCount = wrapper.readInt();
        this.publishedVersions = Array.from({ length: wrapper.readInt() }, () => ({
            id: wrapper.readInt(), label: wrapper.readString(), publishedAt: wrapper.readString()
        }));
        if(wrapper.readString() !== SNAPSHOT_ENCODING) return false;

        const pageChunkCount = wrapper.readInt();
        if(pageChunkCount < 0 || pageChunkCount > MAX_PAGE_CHUNKS) return false;

        const pageChunks = Array.from({ length: pageChunkCount }, () => wrapper.readString());
        this.pages = decodePageChunks(pageChunks);
        this.offers = [];
        return true;
    }
}

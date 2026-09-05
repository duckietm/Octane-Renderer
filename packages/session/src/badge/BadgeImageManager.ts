import { GetAssetManager } from '@octane/assets';
import { GetCommunication, GroupBadgePartsEvent } from '@octane/communication';
import { GetConfiguration } from '@octane/configuration';
import { BadgeImageReadyEvent, GetEventDispatcher } from '@octane/events';
import { OctaneLogger, TextureUtils } from '@octane/utils';
import { Container, Sprite, Texture } from 'pixi.js';
import { BadgeInfo } from './BadgeInfo';
import { GroupBadge } from './GroupBadge';
import { GroupBadgePart } from './GroupBadgePart';

export class BadgeImageManager
{
    public static GROUP_BADGE: string = 'group_badge';
    public static NORMAL_BADGE: string = 'normal_badge';

    private _groupBases: Map<number, string[]> = new Map();
    private _groupSymbols: Map<number, string[]> = new Map();
    private _groupPartColors: Map<number, string> = new Map();
    private _requestedBadges: Map<string, boolean> = new Map();
    private _groupBadgesQueue: Map<string, boolean> = new Map();
    private _readyToGenerateGroupBadges: boolean = false;
    private _groupBadgeAssetsLoaded: boolean = false;
    private _groupBadgeAssetsLoading: Promise<boolean> | null = null;
    private _groupBadgeRetryTimeout: ReturnType<typeof setTimeout> = null;

    public async init(): Promise<void>
    {
        GetCommunication().registerMessageEvent(new GroupBadgePartsEvent(this.onGroupBadgePartsEvent.bind(this)));
    }

    public getBadgeImage(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE, load: boolean = true): Texture
    {
        return this.getBadgeTexture(badgeName, type);
    }

    public getBadgeInfo(badgeName: string): BadgeInfo
    {
        const badge = this.getBadgeTexture(badgeName);

        return (badge) ? new BadgeInfo(badge, false) : new BadgeInfo(this.getBadgePlaceholder(), true);
    }

    public loadBadgeImage(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE): string
    {
        if(GetAssetManager().getTexture(this.getBadgeUrl(badgeName, type))) return badgeName;

        this.getBadgeTexture(badgeName, type);

        return null;
    }

    private getBadgeTexture(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE): Texture
    {
        const url = this.getBadgeUrl(badgeName, type);

        if(!url || !url.length) return null;

        const texture = GetAssetManager().getTexture(url);

        if(texture) return texture;

        if(type === BadgeImageManager.NORMAL_BADGE)
        {
            const loadBadge = async () =>
            {
                try
                {
                    if(!await GetAssetManager().downloadAsset(url)) return;

                    const loadedTexture = GetAssetManager().getTexture(url);

                    if(loadedTexture) GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent(badgeName, loadedTexture));
                }

                catch (err)
                {
                    OctaneLogger.error(err);
                }
            };

            void loadBadge();
        }

        else if(type === BadgeImageManager.GROUP_BADGE)
        {
            this._groupBadgesQueue.set(badgeName, true);
            void this.processGroupBadgeQueue();
        }

        return this.getBadgePlaceholder();
    }

    private getBadgePlaceholder(): Texture
    {
        return GetAssetManager().getTexture(GetConfiguration().getValue<string>('images.url') + '/loading_icon.png');
    }

    public getBadgeUrl(badge: string, type: string = BadgeImageManager.NORMAL_BADGE): string
    {
        let url = null;

        switch(type)
        {
            case BadgeImageManager.NORMAL_BADGE:
                url = (GetConfiguration().getValue<string>('badge.asset.url')).replace('%badgename%', badge);
                break;
            case BadgeImageManager.GROUP_BADGE:
                url = badge;
                break;
        }

        return url;
    }

    private scheduleQueueRetry(): void
    {
        if(this._groupBadgeRetryTimeout) return;

        this._groupBadgeRetryTimeout = setTimeout(() =>
        {
            this._groupBadgeRetryTimeout = null;
            void this.processGroupBadgeQueue();
        }, 250);
    }

    private async ensureGroupBadgeAssetsLoaded(): Promise<boolean>
    {
        if(this._groupBadgeAssetsLoaded) return true;

        if(this._groupBadgeAssetsLoading === null)
        {
            this._groupBadgeAssetsLoading = GetAssetManager().downloadAsset('local://group_badge')
                .then(result =>
                {
                    this._groupBadgeAssetsLoaded = result;

                    return result;
                })
                .catch(err =>
                {
                    OctaneLogger.error(err);

                    return false;
                })
                .finally(() => this._groupBadgeAssetsLoading = null);
        }

        return this._groupBadgeAssetsLoading;
    }

    private async processGroupBadgeQueue(): Promise<void>
    {
        if(!this._readyToGenerateGroupBadges || !this._groupBadgesQueue.size) return;

        if(!await this.ensureGroupBadgeAssetsLoaded())
        {
            this.scheduleQueueRetry();
            return;
        }

        let hasPending = false;

        for(const badgeCode of Array.from(this._groupBadgesQueue.keys()))
        {
            if(!this.loadGroupBadge(badgeCode)) hasPending = true;
        }

        if(hasPending) this.scheduleQueueRetry();
    }

    private loadGroupBadge(badgeCode: string): boolean
    {
        const groupBadge = new GroupBadge(badgeCode);
        const partMatches = [...badgeCode.matchAll(/[bst][0-9]{4,6}/g)];

        for(const partMatch of partMatches)
        {
            const partCode = partMatch[0];
            const shortMethod = (partCode.length === 6);
            const partType = partCode[0];
            const parsedPartId = parseInt(partCode.slice(1, shortMethod ? 3 : 4));
            const partId = ((partType === GroupBadgePart.SYMBOL_ALT) ? (parsedPartId + 100) : parsedPartId);
            const partColor = parseInt(partCode.slice(shortMethod ? 3 : 4, shortMethod ? 5 : 6));
            const partPosition = partCode.length < 6 ? 0 : parseInt(partCode.slice(shortMethod ? 5 : 6, shortMethod ? 6 : 7)); // sometimes position is ommitted
            const part = new GroupBadgePart(partType, partId, partColor, partPosition);

            groupBadge.parts.push(part);
        }

        if(!this.renderGroupBadge(groupBadge)) return false;

        this._requestedBadges.delete(groupBadge.code);
        this._groupBadgesQueue.delete(groupBadge.code);

        return true;
    }

    private renderGroupBadge(groupBadge: GroupBadge): boolean
    {
        const container = new Container();
        const tempSprite = new Sprite(Texture.EMPTY);
        let renderedLayers = 0;

        tempSprite.width = GroupBadgePart.IMAGE_WIDTH;
        tempSprite.height = GroupBadgePart.IMAGE_HEIGHT;

        container.addChild(tempSprite);

        for(const part of groupBadge.parts)
        {
            let isFirst = true;
            let renderedPartLayers = 0;

            const partNames = ((part.type === 'b') ? this._groupBases.get(part.key) : this._groupSymbols.get(part.key));

            if(!partNames || !partNames.length) return false;

            for(const partName of partNames)
            {
                if(!partName || !partName.length) continue;

                const texture = this.getBadgePartTexture(part.type, partName);

                if(!texture) continue;

                const { x, y } = part.calculatePosition(texture);
                const sprite = new Sprite(texture);

                sprite.position.set(x, y);

                if(isFirst)
                {
                    const tintColor = this.getPartTintColor(part.color);

                    if(tintColor !== null) sprite.tint = tintColor;
                }

                isFirst = false;
                renderedLayers++;
                renderedPartLayers++;

                container.addChild(sprite);
            }

            if(!renderedPartLayers) return false;
        }

        if(!renderedLayers) return false;

        const texture = TextureUtils.generateTexture(container);
        container.destroy({ children: true });
        GetAssetManager().setTexture(groupBadge.code, texture);

        GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent(groupBadge.code, texture));

        return true;
    }

    private getBadgePartTexture(partType: string, rawPartName: string): Texture
    {
        const partName = rawPartName.replace('.png', '').replace('.gif', '');
        const withoutLayerSuffix = partName.replace(/_part[12]$/i, '');
        const candidates = new Set<string>();

        candidates.add(partName);
        candidates.add(withoutLayerSuffix);
        candidates.add(`badgepart_${partName}`);
        candidates.add(`badgepart_${withoutLayerSuffix}`);

        if(!partName.startsWith('badgepart_'))
        {
            if((partType === 's') || (partType === 't')) candidates.add(`badgepart_symbol_${partName}`);
            if((partType === 's') || (partType === 't')) candidates.add(`badgepart_symbol_${withoutLayerSuffix}`);
            if(partType === 'b') candidates.add(`badgepart_base_${partName}`);
            if(partType === 'b') candidates.add(`badgepart_base_${withoutLayerSuffix}`);
        }

        for(const candidate of candidates)
        {
            const texture = GetAssetManager().getTexture(candidate);

            if(texture) return texture;
        }

        return null;
    }


    private getPartTintColor(colorId: number): number | null
    {
        let colorHex = (this._groupPartColors.get(colorId) || this._groupPartColors.get(1) || 'FFFFFF');

        if(!colorHex || !colorHex.length) return null;

        if(colorHex.startsWith('#')) colorHex = colorHex.substring(1);

        const tintColor = parseInt(colorHex, 16);

        return Number.isFinite(tintColor) ? tintColor : null;
    }

    private onGroupBadgePartsEvent(event: GroupBadgePartsEvent): void
    {
        if(!event) return;

        const data = event.getParser();

        if(!data) return;

        data.bases.forEach((names, id) => this._groupBases.set(id, names.map(val => val.replace('.png', '').replace('.gif', ''))));

        data.symbols.forEach((names, id) => this._groupSymbols.set(id, names.map(val => val.replace('.png', '').replace('.gif', ''))));

        this._groupPartColors = data.partColors;
        this._readyToGenerateGroupBadges = true;

        void this.processGroupBadgeQueue();
    }
}

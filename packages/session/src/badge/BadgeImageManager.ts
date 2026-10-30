import { GetAssetManager } from '@octane/assets';
import { GetCommunication, GroupBadgePartsEvent } from '@octane/communication';
import { GetConfiguration } from '@octane/configuration';
import { BadgeImageReadyEvent, GetEventDispatcher } from '@octane/events';
import { fillUrlTemplate, OctaneLogger, TextureUtils } from '@octane/utils';
import { CanvasSource, Container, Sprite, Texture } from 'pixi.js';
import { rememberFailedBadge, shouldRetryBadge } from './BadgeFailureCache';
import { BadgeInfo } from './BadgeInfo';
import { GroupBadge } from './GroupBadge';
import { drawGroupBadge, GroupBadgeLayer } from './GroupBadgeCanvas';
import { GroupBadgePart } from './GroupBadgePart';
import { getBadgePartUrl } from './GroupBadgePartUrl';
import { GroupBadgePartTables, readGroupBadgePartsCache, serializeGroupBadgeParts, writeGroupBadgePartsCache } from './GroupBadgePartsCache';

export class BadgeImageManager
{
    public static GROUP_BADGE: string = 'group_badge';
    public static NORMAL_BADGE: string = 'normal_badge';

    private _groupBases: Map<number, string[]> = new Map();
    private _groupSymbols: Map<number, string[]> = new Map();
    private _groupPartColors: Map<number, string> = new Map();
    private static MAX_GROUP_BADGE_ATTEMPTS: number = 20;

    private _requestedBadges: Map<string, boolean> = new Map();
    private _groupBadgesQueue: Map<string, number> = new Map();
    private _readyToGenerateGroupBadges: boolean = false;
    private _groupBadgeRetryTimeout: ReturnType<typeof setTimeout> = null;
    private _groupBadgeImageUrls: Map<string, string> = new Map();
    private _remoteGroupBadges: Map<string, boolean> = new Map();
    private _drawnGroupBadges: Set<string> = new Set();
    private _partsSignature: string = null;
    private _badgeParts: Map<string, 'loading' | 'loaded' | 'failed'> = new Map();
    private _badgePartLoadsInFlight: number = 0;
    // A badge image that failed to load, and when: asked again within the backoff it is not downloaded again.
    private _failedBadgeUrls: Map<string, number> = new Map();
    // Badges being downloaded: a draw while one is on its way asked for it again, and every request sent its own ready event.
    private _loadingBadgeUrls: Set<string> = new Set();

    public async init(): Promise<void>
    {
        GetCommunication().registerMessageEvent(new GroupBadgePartsEvent(this.onGroupBadgePartsEvent.bind(this)));

        // The tables of the last session: badges draw at once, the server's answer replaces them after login.
        const cached = readGroupBadgePartsCache();

        if(cached)
        {
            this.applyPartTables(cached);
            this._partsSignature = serializeGroupBadgeParts(cached);
        }
    }

    /**
     * The image of a group badge for the interface: one URL per badge code, made once (a server image when
     * `group.badge.url` is set, as AIR loads them, otherwise the badge drawn here). Null until it is ready;
     * BadgeImageReadyEvent tells when.
     */
    public getGroupBadgeImageUrl(badgeCode: string, allowServerImage: boolean = true): string
    {
        if(!badgeCode) return null;

        const url = this._groupBadgeImageUrls.get(badgeCode);

        if(url) return url;

        this.getBadgeTexture(badgeCode, BadgeImageManager.GROUP_BADGE, allowServerImage);

        return null;
    }

    /**
     * `allowServerImage` false draws a group badge here even when a badge imager is set up: for the badge editor,
     * whose previews are codes no guild has, so the imager has no image for them.
     */
    public getBadgeImage(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE, load: boolean = true, allowServerImage: boolean = true): Texture
    {
        return this.getBadgeTexture(badgeName, type, allowServerImage);
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

    private getBadgeTexture(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE, allowServerImage: boolean = true): Texture
    {
        const url = this.getBadgeUrl(badgeName, type);

        if(!url || !url.length) return null;

        const texture = GetAssetManager().getTexture(url);

        if(texture) return texture;

        if(type === BadgeImageManager.NORMAL_BADGE)
        {
            // A badge with no image was downloaded again every time it was drawn.
            if(!shouldRetryBadge(this._failedBadgeUrls, url, Date.now())) return null;

            if(this._loadingBadgeUrls.has(url)) return this.getBadgePlaceholder();

            this._loadingBadgeUrls.add(url);

            const loadBadge = async () =>
            {
                try
                {
                    if(!await GetAssetManager().downloadAsset(url))
                    {
                        rememberFailedBadge(this._failedBadgeUrls, url, Date.now());

                        return;
                    }

                    this._failedBadgeUrls.delete(url);

                    const loadedTexture = GetAssetManager().getTexture(url);

                    if(loadedTexture) GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent(badgeName, loadedTexture));
                }

                catch (err)
                {
                    OctaneLogger.error(err);
                }

                finally
                {
                    this._loadingBadgeUrls.delete(url);
                }
            };

            void loadBadge();
        }

        else if(type === BadgeImageManager.GROUP_BADGE)
        {
            if(!allowServerImage || !this.loadRemoteGroupBadge(badgeName))
            {
                if(!this._groupBadgesQueue.has(badgeName)) this._groupBadgesQueue.set(badgeName, 0);
                void this.processGroupBadgeQueue();
            }
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
                url = fillUrlTemplate(GetConfiguration().getValue<string>('badge.asset.url'), '%badgename%', badge);
                break;
            case BadgeImageManager.GROUP_BADGE:
                url = badge;
                break;
        }

        return url;
    }

    /**
     * AIR's way: a badge imager makes the image (`group.badge.url`, a URL with %imagerdata%, as RoomRenderScene reads
     * it too). False when there is no imager or it failed for this badge.
     */
    private loadRemoteGroupBadge(badgeCode: string): boolean
    {
        const state = this._remoteGroupBadges.get(badgeCode);

        if(state !== undefined) return state;

        const configuration = GetConfiguration();
        const template = ((configuration.definitions?.has('group.badge.url') ? configuration.getValue<string>('group.badge.url', '') : '') || '').trim();

        // Only an imager URL counts; the bare placeholder (the default) means the badges are drawn here.
        if(!template.includes('%imagerdata%') || (template === '%imagerdata%')) return false;

        // Configuration values are interpolated when the file loads.
        let url = fillUrlTemplate(template, '%imagerdata%', badgeCode);

        if(url.endsWith('.gif')) url = url.slice(0, -3) + 'png';

        this._remoteGroupBadges.set(badgeCode, true);

        const load = async () =>
        {
            try
            {
                if(await GetAssetManager().downloadAsset(url))
                {
                    const texture = GetAssetManager().getTexture(url);

                    if(texture)
                    {
                        GetAssetManager().setTexture(badgeCode, texture);
                        this._groupBadgeImageUrls.set(badgeCode, url);
                        GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent(badgeCode, texture));

                        return;
                    }
                }
            }
            catch (err)
            {
                OctaneLogger.warn(`Group badge image could not be loaded, drawing it instead: ${ url }`, err);
            }

            // Draw it here instead.
            this._remoteGroupBadges.set(badgeCode, false);
            this.getBadgeTexture(badgeCode, BadgeImageManager.GROUP_BADGE);
        };

        void load();

        return true;
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

    private async processGroupBadgeQueue(): Promise<void>
    {
        if(!this._readyToGenerateGroupBadges || !this._groupBadgesQueue.size) return;

        let hasPending = false;

        for(const badgeCode of Array.from(this._groupBadgesQueue.keys()))
        {
            if(this.loadGroupBadge(badgeCode)) continue;

            // A part image is still downloading; its arrival runs the queue again, so this is no attempt.
            if(this._badgePartLoadsInFlight > 0) continue;

            const attempts = ((this._groupBadgesQueue.get(badgeCode) ?? 0) + 1);

            if(attempts >= BadgeImageManager.MAX_GROUP_BADGE_ATTEMPTS)
            {
                this._groupBadgesQueue.delete(badgeCode);
                this._requestedBadges.delete(badgeCode);

                OctaneLogger.warn(`Group badge could not be rendered, giving up: ${badgeCode}`);
            }
            else
            {
                this._groupBadgesQueue.set(badgeCode, attempts);

                hasPending = true;
            }
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

    /** The layers of a badge in drawing order, or null while a part is unknown or its image is missing. */
    private getGroupBadgeLayers(groupBadge: GroupBadge): GroupBadgeLayer[]
    {
        const layers: GroupBadgeLayer[] = [];

        for(const part of groupBadge.parts)
        {
            let isFirst = true;
            let renderedPartLayers = 0;

            const partNames = ((part.type === 'b') ? this._groupBases.get(part.key) : this._groupSymbols.get(part.key));

            if(!partNames || !partNames.length) return null;

            for(const partName of partNames)
            {
                if(!partName || !partName.length) continue;

                const texture = this.getBadgePartTexture(partName);

                if(!texture) continue;

                const { x, y } = part.calculatePosition(texture);

                layers.push({ texture, x, y, tint: isFirst ? this.getPartTintColor(part.color) : null });

                isFirst = false;
                renderedPartLayers++;
            }

            if(!renderedPartLayers) return null;
        }

        return layers.length ? layers : null;
    }

    private renderGroupBadge(groupBadge: GroupBadge): boolean
    {
        const layers = this.getGroupBadgeLayers(groupBadge);

        if(!layers) return false;

        let texture: Texture = null;
        let imageUrl: string = null;
        const canvas = drawGroupBadge(layers, GroupBadgePart.IMAGE_WIDTH, GroupBadgePart.IMAGE_HEIGHT);

        if(canvas)
        {
            texture = new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: 'nearest' }) });

            try
            {
                if('toDataURL' in canvas) imageUrl = canvas.toDataURL('image/png');
            }
            catch (err)
            {
                OctaneLogger.warn(`Group badge image could not be encoded: ${ groupBadge.code }`, err);
            }
        }
        else
        {
            texture = this.renderGroupBadgeOnGpu(layers);
        }

        if(!texture) return false;

        GetAssetManager().setTexture(groupBadge.code, texture);
        this._drawnGroupBadges.add(groupBadge.code);

        if(imageUrl) this._groupBadgeImageUrls.set(groupBadge.code, imageUrl);
        else this._groupBadgeImageUrls.delete(groupBadge.code);

        GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent(groupBadge.code, texture));

        return true;
    }

    /** The old path, for part images the 2D canvas cannot draw. */
    private renderGroupBadgeOnGpu(layers: GroupBadgeLayer[]): Texture
    {
        const container = new Container();
        const tempSprite = new Sprite(Texture.EMPTY);

        tempSprite.width = GroupBadgePart.IMAGE_WIDTH;
        tempSprite.height = GroupBadgePart.IMAGE_HEIGHT;

        container.addChild(tempSprite);

        for(const layer of layers)
        {
            const sprite = new Sprite(layer.texture);

            sprite.position.set(layer.x, layer.y);

            if(layer.tint !== null) sprite.tint = layer.tint;

            container.addChild(sprite);
        }

        const texture = TextureUtils.generateTexture(container);

        container.destroy({ children: true });

        return texture;
    }

    /**
     * The image of a badge part (`badgepart_<name>.png`). The client ships no parts: they come from the hotel's
     * badge parts folder (`badge.asset.grouparts.url`, %part% is the name), the folder the emulator's badge
     * imager reads too. Each part is downloaded once; null while it is on its way.
     */
    private getBadgePartTexture(rawPartName: string): Texture
    {
        const partName = rawPartName.replace('.png', '').replace('.gif', '');
        const texture = GetAssetManager().getTexture(`badgepart_${ partName }`);

        if(texture) return texture;

        this.loadBadgePart(partName);

        return null;
    }

    private loadBadgePart(partName: string): void
    {
        if(this._badgeParts.has(partName)) return;

        const url = getBadgePartUrl(this.getBadgePartUrlTemplate(), partName);

        if(!url)
        {
            this._badgeParts.set(partName, 'failed');
            OctaneLogger.warn(`Group badge part ${ partName } cannot be loaded: set badge.asset.grouparts.url (with %part%) in the renderer config`);

            return;
        }

        this._badgeParts.set(partName, 'loading');
        this._badgePartLoadsInFlight++;

        const load = async () =>
        {
            let loaded = false;

            try
            {
                if(await GetAssetManager().downloadAsset(url))
                {
                    const texture = GetAssetManager().getTexture(url);

                    if(texture)
                    {
                        GetAssetManager().setTexture(`badgepart_${ partName }`, texture);
                        loaded = true;
                    }
                }
            }
            catch (err)
            {
                OctaneLogger.warn(`Group badge part could not be loaded: ${ url }`, err);
            }

            this._badgeParts.set(partName, loaded ? 'loaded' : 'failed');
            this._badgePartLoadsInFlight--;

            void this.processGroupBadgeQueue();
        };

        void load();
    }

    private getBadgePartUrlTemplate(): string
    {
        const configuration = GetConfiguration();

        return ((configuration.definitions?.has('badge.asset.grouparts.url') ? configuration.getValue<string>('badge.asset.grouparts.url', '') : '') || '').trim();
    }

    private getPartTintColor(colorId: number): number | null
    {
        let colorHex = (this._groupPartColors.get(colorId) || this._groupPartColors.get(1) || 'FFFFFF');

        if(!colorHex || !colorHex.length) return null;

        if(colorHex.startsWith('#')) colorHex = colorHex.substring(1);

        const tintColor = parseInt(colorHex, 16);

        return Number.isFinite(tintColor) ? tintColor : null;
    }

    private applyPartTables(tables: GroupBadgePartTables): void
    {
        const strip = (names: string[]) => names.map(val => val.replace('.png', '').replace('.gif', ''));

        this._groupBases = new Map();
        this._groupSymbols = new Map();

        tables.bases.forEach((names, id) => this._groupBases.set(id, strip(names)));
        tables.symbols.forEach((names, id) => this._groupSymbols.set(id, strip(names)));

        this._groupPartColors = tables.partColors;
        this._readyToGenerateGroupBadges = true;
    }

    private onGroupBadgePartsEvent(event: GroupBadgePartsEvent): void
    {
        if(!event) return;

        const data = event.getParser();

        if(!data) return;

        const tables: GroupBadgePartTables = { bases: data.bases, symbols: data.symbols, partColors: data.partColors };
        const signature = serializeGroupBadgeParts(tables);
        const changed = (this._partsSignature !== null) && (this._partsSignature !== signature);

        this.applyPartTables(tables);

        if(this._partsSignature !== signature) writeGroupBadgePartsCache(signature);

        // Badges drawn from last session's tables are drawn again when the hotel changed them.
        if(changed)
        {
            for(const badgeCode of this._drawnGroupBadges) this._groupBadgesQueue.set(badgeCode, 0);
        }

        this._partsSignature = signature;

        void this.processGroupBadgeQueue();
    }
}

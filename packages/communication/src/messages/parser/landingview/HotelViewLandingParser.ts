import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export type HotelViewLandingSlotType = 'bonus' | 'promotion' | 'catalogpromo' | 'catalogpromosmall' | 'expiringcatalogpage' | 'expiringcatalogpagesmall' | 'communitygoal' | 'dailyquest' | 'nextlimitedrarecountdown' | 'achievementcompetition_hall_of_fame' | 'achievementcompetition_prizes' | 'habbotalentspromo' | 'habbowaypromo' | 'safetyquizpromo' | 'habbomoderationpromo';

export interface IHotelViewLandingSlot
{
    id: number;
    enabled: boolean;
    type: HotelViewLandingSlotType;
    title: string;
    body: string;
    imageUrl: string;
    buttonText: string;
    link: string;
    progress: number;
    progressLabel: string;
    configJson: string;
}

export interface IHotelViewLandingScene
{
    backgroundUrl: string;
    leftUrl: string;
    rightUrl: string;
    drapeUrl: string;
    leftX: number;
    leftY: number;
    rightX: number;
    rightY: number;
    drapeX: number;
    drapeY: number;
    hallOfFameX: number;
    hallOfFameY: number;
    hallOfFameEnabled: boolean;
    hallOfFameMode: string;
    hallOfFameCurrencyType: number;
    hallOfFameUsers: IHotelViewHallOfFameUser[];
}

export interface IHotelViewHallOfFameUser
{
    id: number;
    username: string;
    figure: string;
    gender: string;
}

export class HotelViewLandingParser implements IMessageParser
{
    private _canEdit: boolean = false;
    private _scene: IHotelViewLandingScene = { backgroundUrl: '', leftUrl: '', rightUrl: '', drapeUrl: '', leftX: -1, leftY: -1, rightX: -1, rightY: -1, drapeX: -1, drapeY: -1, hallOfFameX: -1, hallOfFameY: -1, hallOfFameEnabled: false, hallOfFameMode: 'latest_registered', hallOfFameCurrencyType: 0, hallOfFameUsers: [] };
    private _slots: IHotelViewLandingSlot[] = [];

    public flush(): boolean
    {
        this._canEdit = false;
        this._scene = { backgroundUrl: '', leftUrl: '', rightUrl: '', drapeUrl: '', leftX: -1, leftY: -1, rightX: -1, rightY: -1, drapeX: -1, drapeY: -1, hallOfFameX: -1, hallOfFameY: -1, hallOfFameEnabled: false, hallOfFameMode: 'latest_registered', hallOfFameCurrencyType: 0, hallOfFameUsers: [] };
        this._slots = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._canEdit = wrapper.readBoolean();
        this._scene = {
            backgroundUrl: wrapper.readString(),
            leftUrl: wrapper.readString(),
            rightUrl: wrapper.readString(),
            drapeUrl: wrapper.readString(),
            leftX: -1,
            leftY: -1,
            rightX: -1,
            rightY: -1,
            drapeX: -1,
            drapeY: -1,
            hallOfFameX: -1,
            hallOfFameY: -1,
            hallOfFameEnabled: false,
            hallOfFameMode: 'latest_registered',
            hallOfFameCurrencyType: 0,
            hallOfFameUsers: []
        };

        const count = wrapper.readInt();
        this._slots = [];

        for(let i = 0; i < count; i++)
        {
            this._slots.push({
                id: wrapper.readInt(),
                enabled: wrapper.readBoolean(),
                type: wrapper.readString() as HotelViewLandingSlotType,
                title: wrapper.readString(),
                body: wrapper.readString(),
                imageUrl: wrapper.readString(),
                buttonText: wrapper.readString(),
                link: wrapper.readString(),
                progress: wrapper.readInt(),
                progressLabel: wrapper.readString(),
                configJson: wrapper.readString()
            });
        }

        this._scene.hallOfFameEnabled = wrapper.readBoolean();
        this._scene.hallOfFameMode = wrapper.readString();
        this._scene.hallOfFameCurrencyType = wrapper.readInt();

        const hallOfFameCount = wrapper.readInt();

        for(let i = 0; i < hallOfFameCount; i++)
        {
            this._scene.hallOfFameUsers.push({
                id: wrapper.readInt(),
                username: wrapper.readString(),
                figure: wrapper.readString(),
                gender: wrapper.readString()
            });
        }

        this._scene.leftX = wrapper.readInt();
        this._scene.leftY = wrapper.readInt();
        this._scene.rightX = wrapper.readInt();
        this._scene.rightY = wrapper.readInt();
        this._scene.drapeX = wrapper.readInt();
        this._scene.drapeY = wrapper.readInt();
        this._scene.hallOfFameX = wrapper.readInt();
        this._scene.hallOfFameY = wrapper.readInt();

        return true;
    }

    public get canEdit(): boolean
    {
        return this._canEdit;
    }
    public get scene(): IHotelViewLandingScene
    {
        return this._scene;
    }
    public get slots(): IHotelViewLandingSlot[]
    {
        return this._slots;
    }
}

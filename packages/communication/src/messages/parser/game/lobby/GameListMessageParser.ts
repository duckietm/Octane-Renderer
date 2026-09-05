import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { GameConfigurationData } from './GameConfigurationData';

export class GameListMessageParser implements IMessageParser
{
    private _games:GameConfigurationData[];

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._games = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const gameId = wrapper.readInt();
            const gameNameId = wrapper.readString();
            const bgColorHex = wrapper.readString();
            let bgColor = parseInt(bgColorHex, 16);
            bgColor = (bgColor | 0xFF000000);
            const textColorHex = wrapper.readString();
            let textColor = parseInt(textColorHex, 16);
            textColor = (textColor | 0xFF000000);
            const assetUrl = wrapper.readString();
            const supportUrl = wrapper.readString();
            this._games.push(new GameConfigurationData(gameId, gameNameId, bgColor, textColor, assetUrl, supportUrl));
        }

        return true;
    }

    public get games(): GameConfigurationData[]
    {
        return this._games;
    }
}

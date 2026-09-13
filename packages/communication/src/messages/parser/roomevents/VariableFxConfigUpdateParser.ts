import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { readWiredLong } from './WiredVariableData';

/** One drawn Variable FX configuration, as the composer writes it. */
export interface IVariableFxConfigData
{
    configId: number;
    isUserFx: boolean;
    showMode: number;
    showTriggerMask: number;
    showOnMouseHover: boolean;
    showDuration: number;
    categoryId: number;
    styleId: number;
    colorId: number;
    widthId: number;
    rendererId: number;
    defaultMinValue: number;
    defaultMaxValue: number;
    extras: Map<string, string>;
}

export class VariableFxConfigUpdateParser implements IMessageParser
{
    private _configs: IVariableFxConfigData[];

    public flush(): boolean
    {
        this._configs = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._configs = [];

        let totalConfigs = wrapper.readInt();

        while(totalConfigs > 0)
        {
            const configId = wrapper.readInt();
            const isUserFx = wrapper.readBoolean();
            const showMode = wrapper.readInt();
            const showTriggerMask = wrapper.readInt();
            const showOnMouseHover = wrapper.readBoolean();
            const showDuration = wrapper.readInt();
            const categoryId = wrapper.readInt();
            const styleId = wrapper.readInt();
            const colorId = wrapper.readInt();
            const widthId = wrapper.readInt();
            const rendererId = wrapper.readInt();
            const defaultMinValue = readWiredLong(wrapper);
            const defaultMaxValue = readWiredLong(wrapper);
            const extras = new Map<string, string>();

            let totalExtras = wrapper.readInt();

            while(totalExtras > 0)
            {
                extras.set(wrapper.readString(), wrapper.readString());

                totalExtras--;
            }

            this._configs.push({
                configId,
                isUserFx,
                showMode,
                showTriggerMask,
                showOnMouseHover,
                showDuration,
                categoryId,
                styleId,
                colorId,
                widthId,
                rendererId,
                defaultMinValue,
                defaultMaxValue,
                extras
            });

            totalConfigs--;
        }

        return true;
    }

    public get configs(): IVariableFxConfigData[]
    {
        return this._configs;
    }
}

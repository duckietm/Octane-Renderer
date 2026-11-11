import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** A starter room the first-login setup offers. */
export interface IFirstLoginSetupTemplate
{
    templateId: number;
    title: string;
    description: string;
    thumbnail: string;
}

/**
 * Custom first-login setup offer (9496): the starter rooms of an account that was not made on the
 * client's register screen. Sent at login until the user answers with FirstLoginSetupChooseComposer.
 */
export class FirstLoginSetupParser implements IMessageParser
{
    private _templates: IFirstLoginSetupTemplate[];

    public flush(): boolean
    {
        this._templates = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._templates = [];

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._templates.push({
                templateId: wrapper.readInt(),
                title: wrapper.readString(),
                description: wrapper.readString(),
                thumbnail: wrapper.readString()
            });

            count--;
        }

        return true;
    }

    public get templates(): IFirstLoginSetupTemplate[]
    {
        return this._templates;
    }
}

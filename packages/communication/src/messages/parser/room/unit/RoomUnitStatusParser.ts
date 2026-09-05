import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { RoomUnitStatusAction } from './RoomUnitStatusAction';
import { RoomUnitStatusMessage } from './RoomUnitStatusMessage';

function parseLocaleFloat(value: string): number
{
    if(!value) return 0;

    return parseFloat(value.replace(',', '.'));
}

export class RoomUnitStatusParser implements IMessageParser
{
    private _statuses: RoomUnitStatusMessage[];

    public flush(): boolean
    {
        this._statuses = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let totalUnits = wrapper.readInt();

        while(totalUnits > 0)
        {
            const status = this.parseStatus(wrapper);

            if(!status)
            {
                totalUnits--;

                continue;
            }

            this._statuses.push(status);

            totalUnits--;
        }

        return true;
    }

    public parseStatus(wrapper: IMessageDataWrapper): RoomUnitStatusMessage
    {
        if(!wrapper) return null;

        const unitId = wrapper.readInt();
        const x = wrapper.readInt();
        const y = wrapper.readInt();
        const z = parseLocaleFloat(wrapper.readString());
        const headDirection = ((wrapper.readInt() % 8) * 45);
        const direction = ((wrapper.readInt() % 8) * 45);
        const actions = wrapper.readString();

        let targetX = 0;
        let targetY = 0;
        let targetZ = 0;
        let height = 0;
        let canStandUp = false;
        let didMove = false;
        const isSlide = false;

        if(actions)
        {
            const actionParts = actions.split('/');
            const statusActions: RoomUnitStatusAction[] = [];

            for(const action of actionParts)
            {
                const parts = action.split(' ');

                if(parts[0] === '') continue;

                if(parts.length >= 2)
                {
                    switch(parts[0])
                    {
                        case 'mv': {
                            const values = parts[1].split(',');

                            if(values.length >= 3)
                            {
                                targetX = parseInt(values[0]);
                                targetY = parseInt(values[1]);
                                targetZ = parseLocaleFloat(values[2]);
                                didMove = true;
                            }

                            break;
                        }
                        case 'sit': {
                            const sitHeight = parseLocaleFloat(parts[1]);

                            if(parts.length >= 3) canStandUp = (parts[2] === '1');

                            height = sitHeight;

                            break;
                        }
                        case 'lay': {
                            height = parseLocaleFloat(parts[1]);

                            break;
                        }
                    }
                }

                statusActions.push(new RoomUnitStatusAction(parts[0], parts[1]));
            }

            this._statuses.push(new RoomUnitStatusMessage(unitId, x, y, z, height, headDirection, direction, targetX, targetY, targetZ, didMove, canStandUp, statusActions));
        }
    }

    public get statuses(): RoomUnitStatusMessage[]
    {
        return this._statuses;
    }
}

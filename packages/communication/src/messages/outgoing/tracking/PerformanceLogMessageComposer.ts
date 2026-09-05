import { IMessageComposer } from '@octane/api';

export class PerformanceLogMessageComposer implements IMessageComposer<ConstructorParameters<typeof PerformanceLogMessageComposer>>
{
    private _data: ConstructorParameters<typeof PerformanceLogMessageComposer>;

    constructor(elapsedTime: number, userAgent: string, flashVersion: string, operatingSystem: string, cpuArchitecture: string, isDebugger: boolean, totalMemory: number, usedMemory: number, gcCount: number, averageUpdateInterval: number, slowUpdateCount: number)
    {
        this._data = [elapsedTime, userAgent, flashVersion, operatingSystem, cpuArchitecture, isDebugger, totalMemory, usedMemory, gcCount, averageUpdateInterval, slowUpdateCount];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

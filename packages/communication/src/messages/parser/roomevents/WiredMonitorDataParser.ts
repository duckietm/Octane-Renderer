import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWiredMonitorLogData
{
    amount: number;
    latestOccurrenceSeconds: number;
    latestReason: string;
    latestSourceId: number;
    latestSourceLabel: string;
    severity: string;
    type: string;
}

export interface IWiredMonitorHistoryData
{
    occurredAtSeconds: number;
    reason: string;
    sourceId: number;
    sourceLabel: string;
    severity: string;
    type: string;
}

export class WiredMonitorDataParser implements IMessageParser
{
    private _usageCurrentWindow: number;
    private _usageLimitPerWindow: number;
    private _isHeavy: boolean;
    private _delayedEventsPending: number;
    private _delayedEventsLimit: number;
    private _averageExecutionMs: number;
    private _peakExecutionMs: number;
    private _recursionDepthCurrent: number;
    private _recursionDepthLimit: number;
    private _killedRemainingSeconds: number;
    private _usageWindowMs: number;
    private _overloadAverageThresholdMs: number;
    private _overloadPeakThresholdMs: number;
    private _heavyUsageThresholdPercent: number;
    private _heavyConsecutiveWindowsThreshold: number;
    private _overloadConsecutiveWindowsThreshold: number;
    private _heavyDelayedThresholdPercent: number;
    private _logs: IWiredMonitorLogData[];
    private _history: IWiredMonitorHistoryData[];

    public flush(): boolean
    {
        this._usageCurrentWindow = 0;
        this._usageLimitPerWindow = 0;
        this._isHeavy = false;
        this._delayedEventsPending = 0;
        this._delayedEventsLimit = 0;
        this._averageExecutionMs = 0;
        this._peakExecutionMs = 0;
        this._recursionDepthCurrent = 0;
        this._recursionDepthLimit = 0;
        this._killedRemainingSeconds = 0;
        this._usageWindowMs = 0;
        this._overloadAverageThresholdMs = 0;
        this._overloadPeakThresholdMs = 0;
        this._heavyUsageThresholdPercent = 0;
        this._heavyConsecutiveWindowsThreshold = 0;
        this._overloadConsecutiveWindowsThreshold = 0;
        this._heavyDelayedThresholdPercent = 0;
        this._logs = [];
        this._history = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._usageCurrentWindow = wrapper.readInt();
        this._usageLimitPerWindow = wrapper.readInt();
        this._isHeavy = wrapper.readBoolean();
        this._delayedEventsPending = wrapper.readInt();
        this._delayedEventsLimit = wrapper.readInt();
        this._averageExecutionMs = wrapper.readInt();
        this._peakExecutionMs = wrapper.readInt();
        this._recursionDepthCurrent = wrapper.readInt();
        this._recursionDepthLimit = wrapper.readInt();
        this._killedRemainingSeconds = wrapper.readInt();
        this._usageWindowMs = wrapper.readInt();
        this._overloadAverageThresholdMs = wrapper.readInt();
        this._overloadPeakThresholdMs = wrapper.readInt();
        this._heavyUsageThresholdPercent = wrapper.readInt();
        this._heavyConsecutiveWindowsThreshold = wrapper.readInt();
        this._overloadConsecutiveWindowsThreshold = wrapper.readInt();
        this._heavyDelayedThresholdPercent = wrapper.readInt();

        const totalLogs = wrapper.readInt();

        this._logs = [];
        this._history = [];

        for(let i = 0; i < totalLogs; i++)
        {
            this._logs.push({
                type: wrapper.readString(),
                severity: wrapper.readString(),
                amount: wrapper.readInt(),
                latestOccurrenceSeconds: wrapper.readInt(),
                latestReason: wrapper.readString(),
                latestSourceLabel: wrapper.readString(),
                latestSourceId: wrapper.readInt()
            });
        }

        const totalHistory = wrapper.readInt();

        for(let i = 0; i < totalHistory; i++)
        {
            this._history.push({
                type: wrapper.readString(),
                severity: wrapper.readString(),
                occurredAtSeconds: wrapper.readInt(),
                reason: wrapper.readString(),
                sourceLabel: wrapper.readString(),
                sourceId: wrapper.readInt()
            });
        }

        return true;
    }

    public get usageCurrentWindow(): number
    {
        return this._usageCurrentWindow;
    }

    public get usageLimitPerWindow(): number
    {
        return this._usageLimitPerWindow;
    }

    public get isHeavy(): boolean
    {
        return this._isHeavy;
    }

    public get delayedEventsPending(): number
    {
        return this._delayedEventsPending;
    }

    public get delayedEventsLimit(): number
    {
        return this._delayedEventsLimit;
    }

    public get averageExecutionMs(): number
    {
        return this._averageExecutionMs;
    }

    public get peakExecutionMs(): number
    {
        return this._peakExecutionMs;
    }

    public get recursionDepthCurrent(): number
    {
        return this._recursionDepthCurrent;
    }

    public get recursionDepthLimit(): number
    {
        return this._recursionDepthLimit;
    }

    public get killedRemainingSeconds(): number
    {
        return this._killedRemainingSeconds;
    }

    public get usageWindowMs(): number
    {
        return this._usageWindowMs;
    }

    public get overloadAverageThresholdMs(): number
    {
        return this._overloadAverageThresholdMs;
    }

    public get overloadPeakThresholdMs(): number
    {
        return this._overloadPeakThresholdMs;
    }

    public get heavyUsageThresholdPercent(): number
    {
        return this._heavyUsageThresholdPercent;
    }

    public get heavyConsecutiveWindowsThreshold(): number
    {
        return this._heavyConsecutiveWindowsThreshold;
    }

    public get overloadConsecutiveWindowsThreshold(): number
    {
        return this._overloadConsecutiveWindowsThreshold;
    }

    public get heavyDelayedThresholdPercent(): number
    {
        return this._heavyDelayedThresholdPercent;
    }

    public get logs(): IWiredMonitorLogData[]
    {
        return this._logs;
    }

    public get history(): IWiredMonitorHistoryData[]
    {
        return this._history;
    }
}

export interface IConfigurationManager
{
    init(): Promise<void>;
    reloadConfiguration(): Promise<void>;
    resetConfiguration(): void;
    parseConfiguration(data: { [index: string]: any }, overrides?: boolean): boolean;
    interpolate(value: string, regex?: RegExp): string;
    getValue<T>(key: string, value?: T): T;
    registerDefaults(defaults: { [index: string]: unknown }): void;
    setValue<T>(key: string, value: T): void;
    getDefaultConfig(): { [index: string]: any };
    readonly definitions: Map<string, unknown>;
}

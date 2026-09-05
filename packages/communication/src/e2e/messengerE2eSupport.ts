import { IConnection } from '@octane/api';

export interface DetachableCommunicationManager
{
    readonly connection: IConnection;
    dispose(): void;
}

export const detachAuthenticatedConnection = (manager: DetachableCommunicationManager): IConnection =>
{
    const connection = manager.connection;

    connection.ready();
    manager.dispose();

    return connection;
};

export const formatMessengerDiagnostics = (label: string, timeline: string[]): string =>
    `${ label } timeline=${ JSON.stringify(timeline) }`;

import { IConnection, IMessageEvent } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher } from '@octane/events';
import { afterEach, describe, expect, it } from 'vitest';
import { CommunicationManager } from '../CommunicationManager';
import {
    MarkMessengerReadComposer,
    MessengerConversationsEvent,
    MessengerHistoryEvent,
    MessengerMessageAckEvent,
    MessengerMessageEvent,
    MessengerMessageFailedEvent,
    MessengerReadCursorEvent,
    RequestMessengerConversationsComposer,
    RequestMessengerHistoryComposer,
    SendMessengerMessageComposer
} from '../messages';
import { readMessengerE2eEnvironment } from './messengerE2eEnvironment';
import { detachAuthenticatedConnection, formatMessengerDiagnostics } from './messengerE2eSupport';
import { waitFor } from './waitFor';

interface ClientLog
{
    timeline: string[];
    acknowledgements: Array<{ confirmationId: number; conversationId: number; messageId: number }>;
    failures: Array<{ confirmationId: number; errorCode: number }>;
    messages: Array<{ id: number; conversationId: number; senderId: number; message: string; metadata: string }>;
    conversations: Array<{ id: number; participantId: number; lastMessageId: number }>;
    histories: Array<{ conversationId: number; messages: Array<{ id: number; senderId: number; message: string; metadata: string }> }>;
    readCursors: Array<{ conversationId: number; readerId: number; messageId: number }>;
}

interface ConnectedClient
{
    label: string;
    connection: IConnection;
    log: ClientLog;
    dispose(): void;
}

const emptyLog = (): ClientLog => ({
    timeline: [],
    acknowledgements: [],
    failures: [],
    messages: [],
    conversations: [],
    histories: [],
    readCursors: []
});

const attachMessengerLog = (label: string, connection: IConnection): ConnectedClient =>
{
    const log = emptyLog();
    const events: IMessageEvent[] = [];
    let disposed = false;
    const register = (event: IMessageEvent): void =>
    {
        events.push(event);
        connection.addMessageEvent(event);
    };

    register(new MessengerMessageAckEvent((event: MessengerMessageAckEvent) =>
    {
        const parser = event.getParser();
        log.acknowledgements.push({
            confirmationId: parser.confirmationId,
            conversationId: parser.conversationId,
            messageId: parser.messageId
        });
        log.timeline.push(`ack:${ parser.messageId }`);
    }));
    register(new MessengerMessageFailedEvent((event: MessengerMessageFailedEvent) =>
    {
        const parser = event.getParser();
        log.failures.push({ confirmationId: parser.confirmationId, errorCode: parser.errorCode });
        log.timeline.push(`failure:${ parser.confirmationId }:${ parser.errorCode }`);
    }));
    register(new MessengerMessageEvent((event: MessengerMessageEvent) =>
    {
        const message = event.getParser().message;
        log.messages.push({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            message: message.message,
            metadata: message.metadata
        });
        log.timeline.push(`message:${ message.id }`);
    }));
    register(new MessengerConversationsEvent((event: MessengerConversationsEvent) =>
    {
        const conversations = event.getParser().conversations;
        log.conversations.push(...conversations.map(conversation => ({
            id: conversation.id,
            participantId: conversation.participantId,
            lastMessageId: conversation.lastMessageId
        })));
        log.timeline.push(`conversations:${ conversations.length }`);
    }));
    register(new MessengerHistoryEvent((event: MessengerHistoryEvent) =>
    {
        const parser = event.getParser();
        log.histories.push({
            conversationId: parser.conversationId,
            messages: parser.messages.map(message => ({
                id: message.id,
                senderId: message.senderId,
                message: message.message,
                metadata: message.metadata
            }))
        });
        log.timeline.push(`history:${ parser.conversationId }:${ parser.messages.length }`);
    }));
    register(new MessengerReadCursorEvent((event: MessengerReadCursorEvent) =>
    {
        const parser = event.getParser();
        log.readCursors.push({
            conversationId: parser.conversationId,
            readerId: parser.readerId,
            messageId: parser.messageId
        });
        log.timeline.push(`read:${ parser.messageId }`);
    }));

    return {
        label,
        connection,
        log,
        dispose: () =>
        {
            if(disposed) return;

            disposed = true;
            for(const event of events) connection.removeMessageEvent(event);
            connection.dispose();
        }
    };
};

const authenticate = async (label: string, ticket: string): Promise<ConnectedClient> =>
{
    GetConfiguration().setValue('sso.ticket', ticket);
    const manager = new CommunicationManager();
    (manager as unknown as { _machineIdPromise: Promise<string> })._machineIdPromise = Promise.resolve(`IID-E2E-MESSENGER-${ label }`);
    await manager.init();
    const connection = detachAuthenticatedConnection(manager);

    return attachMessengerLog(label, connection);
};

const readSessionCount = async (probeUrl: string, userId: number): Promise<number> =>
{
    const response = await fetch(`${ probeUrl }/session-count?userId=${ userId }`);

    if(!response.ok) throw new Error(`Session-count probe failed with HTTP ${ response.status }`);

    return ((await response.json()) as { activeSessions: number }).activeSessions;
};

const waitForClients = async (
    predicate: () => boolean | Promise<boolean>,
    description: string,
    clients: ConnectedClient[],
    timeoutMs = 10000): Promise<void> =>
{
    try
    {
        await waitFor(predicate, { timeoutMs, description });
    }
    catch (error)
    {
        const diagnostics = clients
            .map(client => formatMessengerDiagnostics(client.label, client.log.timeline))
            .join('; ');
        throw new Error(`${ (error as Error).message }; ${ diagnostics }`);
    }
};

const required = <T>(value: T | undefined, description: string): T =>
{
    if(value === undefined) throw new Error(`Missing ${ description }`);

    return value;
};

describe('Polaris Messenger lifecycle', () =>
{
    const clients: ConnectedClient[] = [];

    afterEach(() =>
    {
        for(const client of [ ...clients ].reverse()) client.dispose();
        clients.length = 0;
        GetEventDispatcher().removeAllListeners();
        GetConfiguration().resetConfiguration();
    });

    it('delivers online, persists offline, restores history and synchronizes read state', async () =>
    {
        const environment = readMessengerE2eEnvironment(process.env);
        const configuration = GetConfiguration();
        configuration.resetConfiguration();
        configuration.setValue('socket.url', environment.wsUrl);
        configuration.setValue('crypto.ws.enabled', false);
        configuration.setValue('system.pong.manually', false);

        const clientB = await authenticate('B', environment.secondSsoTicket);
        clients.push(clientB);
        const clientA = await authenticate('A', environment.ssoTicket);
        clients.push(clientA);

        const token = `${ Date.now() }-${ process.pid }`;
        const metadata = `e2e:${ token }`;
        const onlineBody = `online-${ token }`;
        const offlineBody = `offline-${ token }`;

        clientA.connection.send(new SendMessengerMessageComposer(
            0, environment.secondUserId, 41001, 0, onlineBody, metadata));
        await waitForClients(() =>
            clientA.log.acknowledgements.some(item => item.confirmationId === 41001)
            && clientB.log.messages.some(item => item.message === onlineBody),
        'online Messenger acknowledgement and delivery', [ clientA, clientB ]);

        const onlineAck = required(
            clientA.log.acknowledgements.find(item => item.confirmationId === 41001), 'online acknowledgement');
        const onlineDelivery = required(
            clientB.log.messages.find(item => item.message === onlineBody), 'online delivery');
        expect(onlineAck.messageId).toBeGreaterThan(0);
        expect(onlineDelivery).toMatchObject({
            id: onlineAck.messageId,
            conversationId: onlineAck.conversationId,
            senderId: environment.userId,
            message: onlineBody,
            metadata
        });
        expect(clientA.log.failures).toEqual([]);

        clientB.dispose();
        await waitForClients(
            async () => (await readSessionCount(environment.probeUrl, environment.secondUserId)) === 0,
            'second user to leave the reconnect grace period', [ clientA, clientB ], 45000);

        clientA.connection.send(new SendMessengerMessageComposer(
            onlineAck.conversationId, environment.secondUserId, 41002, 0, offlineBody, metadata));
        await waitForClients(
            () => clientA.log.acknowledgements.some(item => item.confirmationId === 41002),
            'offline Messenger acknowledgement', [ clientA ]);
        const offlineAck = required(
            clientA.log.acknowledgements.find(item => item.confirmationId === 41002), 'offline acknowledgement');
        expect(offlineAck.messageId).toBeGreaterThan(onlineAck.messageId);

        const reconnectedB = await authenticate('B-RECONNECTED', environment.secondSsoTicket);
        clients.push(reconnectedB);
        reconnectedB.connection.send(new RequestMessengerConversationsComposer());
        await waitForClients(
            () => reconnectedB.log.conversations.some(item => item.participantId === environment.userId),
            'direct conversation after reconnect', [ clientA, reconnectedB ]);
        const conversation = required(
            reconnectedB.log.conversations.find(item => item.participantId === environment.userId), 'direct conversation');
        expect(conversation.id).toBe(offlineAck.conversationId);
        expect(conversation.lastMessageId).toBe(offlineAck.messageId);

        reconnectedB.connection.send(new RequestMessengerHistoryComposer(conversation.id, 0, 30));
        await waitForClients(
            () => reconnectedB.log.histories.some(item => item.conversationId === conversation.id),
            'Messenger history after reconnect', [ clientA, reconnectedB ]);
        const history = required(
            reconnectedB.log.histories.find(item => item.conversationId === conversation.id), 'Messenger history');
        expect(history.messages.filter(message => message.metadata === metadata)).toEqual([
            expect.objectContaining({ id: onlineAck.messageId, message: onlineBody }),
            expect.objectContaining({ id: offlineAck.messageId, message: offlineBody })
        ]);

        reconnectedB.connection.send(new MarkMessengerReadComposer(conversation.id, offlineAck.messageId));
        await waitForClients(
            () => clientA.log.readCursors.some(item => item.messageId === offlineAck.messageId),
            'sender read cursor', [ clientA, reconnectedB ]);
        expect(clientA.log.readCursors).toContainEqual({
            conversationId: offlineAck.conversationId,
            readerId: environment.secondUserId,
            messageId: offlineAck.messageId
        });
        expect(clientA.log.failures).toEqual([]);
        expect(await readSessionCount(environment.probeUrl, environment.userId)).toBe(1);
        expect(await readSessionCount(environment.probeUrl, environment.secondUserId)).toBe(1);
    });
});

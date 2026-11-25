import { afterEach, describe, expect, it } from 'vitest';
import { GetConfiguration } from '@octane/configuration';
import { LocalizationManager } from './LocalizationManager';

// A ${...} placeholder in a text, which can come from the server, fell back to any configuration value.
describe('LocalizationManager configuration placeholders', () =>
{
    afterEach(() =>
    {
        GetConfiguration().setValue('socket.url', undefined);
        GetConfiguration().setValue('url.prefix', undefined);
        GetConfiguration().setValue('localization.placeholder.configuration.keys', undefined);
    });

    it('fills an allowed configuration key and leaves any other one as its name', () =>
    {
        GetConfiguration().setValue('url.prefix', 'https://hotel.test');
        GetConfiguration().setValue('socket.url', 'wss://internal:2096');

        const localization = new LocalizationManager();

        expect(localization.getValue('Visit ${url.prefix}/home')).toBe('Visit https://hotel.test/home');
        expect(localization.getValue('Server ${socket.url}')).toBe('Server socket.url');
    });

    it('fills a key the configuration lists as allowed', () =>
    {
        GetConfiguration().setValue('socket.url', 'wss://internal:2096');
        GetConfiguration().setValue('localization.placeholder.configuration.keys', [ 'socket.url' ]);

        expect(new LocalizationManager().getValue('Server ${socket.url}')).toBe('Server wss://internal:2096');
    });

    it('still lets client code read a configuration value directly, as a string', () =>
    {
        GetConfiguration().setValue('socket.url', 'wss://internal:2096');

        expect(new LocalizationManager().getValue('socket.url')).toBe('wss://internal:2096');
    });
});

const FORUM_DETAILS = 'Score %RATING%, last message by <a href="event:friendbar/user/%LAST_AUTHOR_NAME%">%LAST_AUTHOR_NAME%</a> %UPDATE_TIME%';
const THREAD_DETAILS = 'By <a href="event:friendbar/user/%THREAD_AUTHOR_NAME%">%THREAD_AUTHOR_NAME%</a> %CREATION_TIME%, last message by <a href="event:friendbar/user/%LAST_AUTHOR_NAME%">%LAST_AUTHOR_NAME%</a> %UPDATE_TIME%';

const manager = () =>
{
    const localization = new LocalizationManager();

    localization.setValue('groupforum.view.forum_details', FORUM_DETAILS);
    localization.setValue('groupforum.view.thread_details', THREAD_DETAILS);
    localization.setValue('friendlytime.seconds.ago', '%amount% seconds ago');

    return localization;
};

describe('LocalizationManager parameters (AIR Localization.fillParameterValues)', () =>
{
    it('fills every occurrence of a parameter, so a forum without messages reads like AIR', () =>
    {
        const localization = manager();
        const updateTime = localization.getValueWithParameters('friendlytime.seconds.ago', [ 'amount', 'AMOUNT' ], [ '0', '0' ]);

        expect(localization.getValueWithParameters('groupforum.view.forum_details', [ 'RATING', 'LAST_AUTHOR_NAME', 'UPDATE_TIME' ], [ '0', '', updateTime ]))
            .toBe('Score 0, last message by <a href="event:friendbar/user/"></a> 0 seconds ago');
    });

    it('fills both author names of a thread row', () =>
    {
        expect(manager().getValueWithParameters('groupforum.view.thread_details', [ 'THREAD_AUTHOR_NAME', 'CREATION_TIME', 'LAST_AUTHOR_NAME', 'UPDATE_TIME' ], [ 'Ann', '1 day ago', 'Bob', '2 hours ago' ]))
            .toBe('By <a href="event:friendbar/user/Ann">Ann</a> 1 day ago, last message by <a href="event:friendbar/user/Bob">Bob</a> 2 hours ago');
    });

    it('matches the parameter in any letter case and inserts the value literally', () =>
    {
        const localization = manager();

        expect(localization.getValueWithParameters('friendlytime.seconds.ago', [ 'AMOUNT' ], [ '5' ])).toBe('5 seconds ago');
        expect(localization.getValueWithParameter('groupforum.view.forum_details', 'last_author_name', '$&x')).toContain('user/$&x">$&x</a>');
    });

    it('fills registered parameters everywhere too', () =>
    {
        const localization = manager();

        localization.registerParameter('groupforum.view.forum_details', 'LAST_AUTHOR_NAME', 'Cid');

        expect(localization.getValue('groupforum.view.forum_details')).toContain('user/Cid">Cid</a>');
    });

    it('takes a parameter name with pattern characters as plain text', () =>
    {
        expect(LocalizationManager.escapeRegExp('a(b)*')).toBe('a\\(b\\)\\*');
        expect(LocalizationManager.replaceParameter('cost %x(% now', 'x(', '5')).toBe('cost 5 now');
    });
});

describe('LocalizationManager text files and furniture texts', () =>
{
    const withTexts = (...documents: { [index: string]: unknown }[]) =>
    {
        const localization = new LocalizationManager();

        for(const document of documents) (localization as unknown as { parseLocalization(data: object): boolean }).parseLocalization(document);

        return localization;
    };

    it('reads keys from the text files on demand, a later file winning', () =>
    {
        const localization = withTexts({ 'a': 'first', 'b': 'only first' }, { 'a': 'second' });

        expect(localization.getValue('a')).toBe('second');
        expect(localization.getValue('b')).toBe('only first');
        expect(localization.hasValue('b')).toBe(true);
        expect(localization.hasValue('missing')).toBe(false);
        expect(localization.getValue('missing')).toBe('missing');
    });

    it('turns a written \\n of a text file into a line break', () =>
    {
        expect(withTexts({ 'lines': 'one\\ntwo' }).getValue('lines')).toBe('one\ntwo');
    });

    it('lets setValue win over the text files', () =>
    {
        const localization = withTexts({ 'a': 'from file' });

        localization.setValue('a', 'set');

        expect(localization.getValue('a')).toBe('set');
    });

    it('answers furniture texts from the furniture data while it knows the item', () =>
    {
        const localization = withTexts({ 'roomItem.name.1': 'file name', 'roomItem.name.2': 'file only', 'room.name': 'room' });
        const names: Record<string, string> = { 'roomItem.name.1': 'Chair', 'wallItem.desc.5': 'A poster\\nwith a newline' };
        const asked: string[] = [];

        localization.setValue('roomItem.name.1', 'stale copy');
        localization.setValue('wallItem.name.9', 'unknown to the furniture data');
        localization.setFurnitureResolver(key =>
        {
            asked.push(key);

            return names[key] ?? null;
        });

        expect(localization.getValue('roomItem.name.1')).toBe('Chair');
        expect(localization.hasValue('wallItem.desc.5')).toBe(true);
        // Kept as raw as the furniture data has it, as setValue used to store it.
        expect(localization.getValue('wallItem.desc.5')).toBe('A poster\\nwith a newline');
        expect(localization.getValue('wallItem.name.9')).toBe('unknown to the furniture data');
        expect(localization.getValue('roomItem.name.2')).toBe('file only');
        expect(localization.getValue('room.name')).toBe('room');
        expect(asked).not.toContain('room.name');

        localization.setOverrideValues(new Map([ [ 'roomItem.name.1', 'Stuhl' ] ]));

        expect(localization.getValue('roomItem.name.1')).toBe('Stuhl');

        localization.setFurnitureResolver(null);
        localization.clearOverrideValues();

        expect(localization.getValue('roomItem.name.1')).toBe('stale copy');
    });
});

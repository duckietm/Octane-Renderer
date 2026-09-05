import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export const aliases = {
    '@octane/api': resolve(__dirname, 'packages/api/src'),
    '@octane/assets': resolve(__dirname, 'packages/assets/src'),
    '@octane/avatar': resolve(__dirname, 'packages/avatar/src'),
    '@octane/camera': resolve(__dirname, 'packages/camera/src'),
    '@octane/communication': resolve(__dirname, 'packages/communication/src'),
    '@octane/configuration': resolve(__dirname, 'packages/configuration/src'),
    '@octane/events': resolve(__dirname, 'packages/events/src'),
    '@octane/localization': resolve(__dirname, 'packages/localization/src'),
    '@octane/room': resolve(__dirname, 'packages/room/src'),
    '@octane/session': resolve(__dirname, 'packages/session/src'),
    '@octane/sound': resolve(__dirname, 'packages/sound/src'),
    '@octane/utils': resolve(__dirname, 'packages/utils/src')
};

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['packages/**/*.{test,spec}.{js,ts}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['packages/*/src/**/*.ts'],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/*.d.ts',
                '**/index.ts',
                '**/*.test.ts',
                '**/*.spec.ts'
            ]
        },
        alias: aliases
    },
    resolve: {
        alias: aliases
    }
});

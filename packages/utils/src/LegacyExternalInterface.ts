declare global
{
	interface Window
	{
		FlashExternalInterface?:
		{
			legacyTrack?: (
				category: string,
				action: string,
				data: unknown[]
			) => void;
			logDebug?: (...params: string[]) => void;
			disconnect?: (reasonCode: number, reasonString: string) => void;
			logout?: () => void;
			openWebPageAndMinimizeClient?: (pageUrl: string) => void;
			heartBeat?: () => void;
			logEventLog?: (log: string) => void;
			openPage?: (pageUrl: string) => void;
			closeWebPageAndRestoreClient?: () => void;
			openHabblet?: (name: string, param: string) => void;
			closeHabblet?: (name: string, param: string) => void;
			openExternalLink?: (link: string) => void;
			roomVisited?: (roomId: number) => void;
			openMinimail?: (target: string) => void;
			openNews?: () => void;
			closeNews?: () => void;
			openAvatars?: () => void;
			openRoomEnterAd?: () => void;
			updateFigure?: (figure: string) => void;
		};

		FlashExternalGameInterface?:
		{
			showGame?: (url: string) => void;
			hideGame?: () => void;
		};
	}
}

export class LegacyExternalInterface
{
    private static readonly MESSAGE_KEY = 'Nitro_LegacyExternalInterface';
    private static readonly GAME_MESSAGE_KEY = 'Nitro_LegacyExternalGameInterface';
    private static _isListeningForPostMessages = false;
    private static _messageListener: (ev: MessageEvent) => void = null;

    // Whitelist of allowed methods that can be called via postMessage
    // This prevents arbitrary code execution from malicious postMessage calls
    private static readonly ALLOWED_EXTERNAL_METHODS: ReadonlySet<string> = new Set([
        'cycleWallpaper',
        'cycleFloor',
        'cycleLandscape',
        'cycleBackgroundColor',
        'cycleAvatarLightLevel',
        'cycleAvatarName',
        'cycleAvatarTyping',
        'cycleAvatarEffect',
        'cycleAvatarIdle',
        'cycleAvatarDance',
        'cycleAvatarExpression',
        'cycleAvatarPosture',
        'cycleAvatarSign',
        'cycleAvatarSleep',
        'cycleAvatarTalk',
        'cycleAvatarWave',
        'cycleZoom',
        'cycleRoomBackgroundColor'
    ]);

    // Blocklist of dangerous global function/property names that cannot be overwritten
    // This prevents security vulnerabilities while allowing legitimate callbacks
    private static readonly BLOCKED_CALLBACK_NAMES: ReadonlySet<string> = new Set([
        // JavaScript execution functions
        'eval',
        'Function',
        'constructor',
        // Prototype pollution vectors
        'prototype',
        '__proto__',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        // Global objects
        'window',
        'document',
        'globalThis',
        'self',
        'top',
        'parent',
        'frames',
        // Module/import system
        'require',
        'import',
        'module',
        'exports',
        // Network/storage APIs
        'fetch',
        'XMLHttpRequest',
        'WebSocket',
        'Worker',
        'SharedWorker',
        'ServiceWorker',
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'caches',
        // Object prototype methods
        'toString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
        // Potentially dangerous DOM methods
        'postMessage',
        'addEventListener',
        'removeEventListener',
        'dispatchEvent',
        'setTimeout',
        'setInterval',
        'setImmediate',
        'requestAnimationFrame',
        'queueMicrotask'
    ]);

    // Allowed origins for postMessage - empty means same-origin only
    // Add trusted origins here if cross-origin communication is needed
    private static _allowedOrigins: Set<string> = new Set();

    public static setAllowedOrigins(origins: string[]): void
    {
        this._allowedOrigins = new Set(origins);
    }

    public static get available(): boolean
    {
        if(!this._isListeningForPostMessages)
        {
            this._isListeningForPostMessages = true;

            this._messageListener = (ev: MessageEvent) =>
            {
                // Validate origin - only accept from same origin or explicitly allowed origins
                if(ev.origin !== window.location.origin && !this._allowedOrigins.has(ev.origin))
                {
                    return;
                }

                if(typeof ev.data !== 'string') return;

                if(ev.data.startsWith(LegacyExternalInterface.MESSAGE_KEY))
                {
                    try
                    {
                        const { method, params } = JSON.parse(
                            ev.data.substring(LegacyExternalInterface.MESSAGE_KEY.length)
                        );

                        // Validate method is in whitelist before executing
                        if(!this.ALLOWED_EXTERNAL_METHODS.has(method))
                        {
                            console.warn(`[LegacyExternalInterface] Blocked unauthorized method call: ${method}`);
                            return;
                        }

                        // Validate params is an array
                        if(!Array.isArray(params))
                        {
                            console.warn(`[LegacyExternalInterface] Invalid params for method: ${method}`);
                            return;
                        }

                        const fn = (window as any)[method];
                        if(typeof fn !== 'function') return;

                        fn(...params);
                    }
                    catch (e)
                    {
                        console.error('[LegacyExternalInterface] Error processing message:', e);
                    }
                    return;
                }
            };

            window.addEventListener('message', this._messageListener);
        }

        return true;
    }

    public static dispose(): void
    {
        if(this._messageListener)
        {
            window.removeEventListener('message', this._messageListener);
            this._messageListener = null;
            this._isListeningForPostMessages = false;
        }
    }

    public static call<K extends keyof typeof window.FlashExternalInterface>(
        method: K,
        ...params: Parameters<typeof window.FlashExternalInterface[K]>
    ): ReturnType<typeof window.FlashExternalInterface[K]> | undefined
    {
        if(window.top !== window)
        {
            // Use parent origin if known, otherwise use '*' with caution
            // Note: Using '*' is necessary when the parent origin is unknown
            // The receiving end should validate the message content
            const targetOrigin = window.location.ancestorOrigins?.length > 0
                ? window.location.ancestorOrigins[0]
                : '*';

            window.top.postMessage(LegacyExternalInterface.MESSAGE_KEY + JSON.stringify({
                method,
                params
            }), targetOrigin);
        }

        if(!('FlashExternalInterface' in window)) return undefined;

        const fn = window.FlashExternalInterface[method] as Function;

        return typeof fn !== 'undefined' ? fn(...params) : undefined;
    }

    public static callGame<K extends keyof typeof window.FlashExternalGameInterface>(
        method: K,
        ...params: Parameters<typeof window.FlashExternalGameInterface[K]>
    ): ReturnType<typeof window.FlashExternalGameInterface[K]> | undefined
    {
        if(window.top !== window)
        {
            // Use parent origin if known, otherwise use '*' with caution
            const targetOrigin = window.location.ancestorOrigins?.length > 0
                ? window.location.ancestorOrigins[0]
                : '*';

            window.top.postMessage(LegacyExternalInterface.GAME_MESSAGE_KEY + JSON.stringify({
                method,
                params
            }), targetOrigin);
        }

        if(!('FlashExternalGameInterface' in window)) return undefined;

        const fn = window.FlashExternalGameInterface[method] as Function;

        return typeof fn !== 'undefined' ? fn(...params) : undefined;
    }

    public static addCallback(name: string, func: Function): boolean
    {
        // Validate callback name is not empty
        if(!name || typeof name !== 'string' || name.trim().length === 0)
        {
            console.warn('[LegacyExternalInterface] Invalid callback name');
            return false;
        }

        // Check against blocklist of dangerous global function names
        // This prevents overwriting critical globals like 'eval', 'Function', etc.
        if(this.BLOCKED_CALLBACK_NAMES.has(name))
        {
            console.warn(`[LegacyExternalInterface] Blocked registration of dangerous callback: ${name}`);
            return false;
        }

        // Additional safety: prevent overwriting existing non-function properties
        const existing = (window as any)[name];
        if(existing !== undefined && typeof existing !== 'function')
        {
            console.warn(`[LegacyExternalInterface] Cannot overwrite non-function property: ${name}`);
            return false;
        }

        (window as any)[name] = func;
        return true;
    }

    public static removeCallback(name: string): boolean
    {
        // Validate callback name
        if(!name || typeof name !== 'string' || name.trim().length === 0)
        {
            return false;
        }

        // Don't allow removal of blocked/dangerous globals
        if(this.BLOCKED_CALLBACK_NAMES.has(name))
        {
            return false;
        }

        if((window as any)[name] !== undefined)
        {
            delete (window as any)[name];
            return true;
        }

        return false;
    }
}

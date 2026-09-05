export interface IUserDataSnapshot
{
    userId: number;
    userName: string;
    figure: string;
    gender: string;
    realName: string;
    respectsReceived: number;
    respectsLeft: number;
    respectsPetLeft: number;
    canChangeName: boolean;
    clubLevel: number;
    securityLevel: number;
    isAmbassador: boolean;
    isEmailVerified: boolean;
    isNoob: boolean;
    isAuthenticHabbo: boolean;
    isSystemOpen: boolean;
    isSystemShutdown: boolean;
    uiFlags: number;
    tags: ReadonlyArray<string>;
    // Rank metadata mirrored from `permission_ranks` (Arcturus emulator
    // ≥ 4.2.10 ships these via `UserPermissionsComposer`). Older
    // emulators leave them at the defaults (rankId=0, empty strings)
    // because the renderer-side parser short-circuits on bytesAvailable.
    rankId: number;
    rankName: string;
    rankBadge: string;
    rankPrefix: string;
    rankPrefixColor: string;
}

# Octane Renderer — Claude project context

Pure-TypeScript renderer library for the Octane retro Habbo client.
Wraps **PixiJS v8** for room/avatar rendering and provides the WebSocket
+ event-bus infrastructure that the React client (`../octane`) sits on
top of.

## Stack

- **TypeScript 6.0** (root) + **tsgo** (`@typescript/native-preview`,
  TS 7 preview compiler — used by `yarn compile:fast`, ~7× faster on
  this codebase)
- **PixiJS v8** (`pixi.js@8.18`)
- **Vite 8** for build + bundling
- **Vitest 4** for unit tests
- **Yarn 4.18 workspaces** (`packages/*`) through Corepack, using the
  `node-modules` linker for compatibility with the existing build tooling.
- **No React** — this is a pure TS library; React lives in `../octane`.

## Workspace layout

Twelve internal packages under `packages/*/src/`, each pinning
`typescript: ^6.0.3` in its own `devDependencies`:

```
packages/
  api              public interfaces (IEventDispatcher, ISessionDataManager, ...)
  assets           asset loading + caching
  avatar           avatar rendering / figure resolution
  camera           in-room camera widget
  communication    WebSocket + composer/parser pipeline
  configuration    runtime config loader
  events           EventDispatcher + OctaneEventType + per-domain events
  localization     LocalizationManager
  room             RoomEngine + RoomVisualization
  session          SessionDataManager + RoomSessionManager + handlers
  sound            SoundManager (howler-based)
  utils            shared utilities (BinaryReader, Logger, …)
```

Root `index.ts` re-exports everything from `@octane/*` so the React
client gets a flat `import { … } from '@octane/renderer'`.

## React-friendly API additions (v2.1.0)

Three additions matter for the React client integration. Keep these
backwards-compatible:

### `EventDispatcher.subscribe(type, callback): () => void`

Signature matches what `useSyncExternalStore` expects — returns an
unsubscriber, no need to juggle callback identity. Implemented in
`packages/events/src/EventDispatcher.ts`. The legacy
`addEventListener` / `removeEventListener` still work.

### `CommunicationManager.subscribeMessage(eventCtor, handler): () => void`

Equivalent for packet streams. Implemented in
`packages/communication/src/CommunicationManager.ts`.

### Snapshot getters (referentially stable, lazy-frozen, invalidated on mutation)

Pattern: `getXxxSnapshot()` returns a frozen value cached internally;
mutators call `invalidateXxxSnapshot()` which drops the cache AND
dispatches an invalidation event. The React side reads via
`useSyncExternalStore`.

| Manager | Getter | Invalidation event |
|---|---|---|
| `SessionDataManager` | `getUserDataSnapshot(): Readonly<IUserDataSnapshot>` | `SESSION_DATA_UPDATED` |
| `RoomSessionManager` | `getActiveRoomSessionSnapshot(): Readonly<IRoomSessionSnapshot> \| null` | `ROOM_SESSION_UPDATED` |
| `IgnoredUsersManager` | `getIgnoredUsersSnapshot(): ReadonlyArray<string>` | `IGNORED_USERS_UPDATED` |
| `GroupInformationManager` | `getGroupBadgesSnapshot(): ReadonlyMap<number, string>` | `GROUP_BADGES_UPDATED` (only on real changes — no-op refresh stays quiet) |
| `UserDataManager` | `getRoomUserListSnapshot(): ReadonlyArray<IRoomUserData>` | `ROOM_USER_LIST_UPDATED` (inner IRoomUserData kept mutable — don't deep-clone) |
| `SoundManager` | `getVolumesSnapshot(): Readonly<ISoundVolumesSnapshot>` | `SOUND_VOLUMES_UPDATED` (only when a volume actually changes) |

Snapshot interface contracts live under `packages/api/src/octane/session/`
and `packages/api/src/octane/sound/`. When adding a new snapshot, the
checklist is:
1. Define the `Ixxx Snapshot` interface in `packages/api/src/octane/...`
   and export it from the matching `index.ts`.
2. Add a `XXX_UPDATED` member to `packages/events/src/OctaneEventType.ts`.
3. Add `getXxxSnapshot()` to the interface AND impl; cache + invalidate
   on every mutation path (don't forget batch operations like queue
   truncation — invalidate AFTER the full batch, not mid-way).

Adding snapshots here is the preferred way to unblock new React
widgets — prefer it over exposing raw event-listener APIs on the
client side.

## Recent renderer changes (`feat/react19-event-bus`)

Tracked separately from the v2.1.0 batch above; all are
non-breaking additions or align-with-Arcturus fixes:

### RoomEnterComposer: optional `spawnX` / `spawnY`

`new RoomEnterComposer(roomId, password?, spawnX?, spawnY?)`. The
Arcturus `RequestRoomLoadEvent` handler reads the two extra ints only
when `packet.remaining >= 8`, so the same composer header serves both
the legacy 2-arg form (door spawn) and the 4-arg form (reconnect /
respawn at a specific tile). RoomSession + RoomSessionManager use the
4-arg variant in their `enterRoom` / reconnect paths.

### RoomSettingsData: `allowUnderpass` field

`RoomSettingsData` (and its parser) now exposes `allowUnderpass:
boolean`. Arcturus' `RoomSettingsComposer` already appends one
trailing int for this flag, and the new parser reads it via
`if(wrapper.bytesAvailable) … readInt() === 1` so older servers that
don't emit the field still parse cleanly. `SaveRoomSettingsComposer`
accepts an optional `allowUnderpass` arg at the end of its parameter
list; the server-side `RoomSettingsSaveEvent` reads it under
`packet.bytesAvailable() > 0`.

### `RoomUnitParser` per-user `borderId` (Infostand Borders wire contract)

`RoomUsersComposer` on Arcturus (post `54259f8` / fork commit `8f8f568`
"Infostand Borders") appends `appendInt(getInfostandBorder())` at the
end of EVERY user record — habbo, bot, rentable bot — using `0` as the
constant for records without a real border. To stay wire-aligned with
that, `RoomUnitParser` reads `user.borderId = wrapper.readInt();`
unconditionally inside the per-user loop, after
`roomEntryMethod` / `roomEntryTeleportId`.

DO NOT wrap this in a `wrapper.bytesAvailable ? readInt() : 0` guard.
`bytesAvailable` is a boolean meaning "any bytes left in the WHOLE
packet?" — not "any bytes left for THIS user". For any non-last user
the guard evaluates `true` (next user's bytes follow) and reads, which
is fine ONLY by coincidence when the server emits borderId per user.
On a server that doesn't emit it, the guard steals 4 bytes from the
next record and cascade-corrupts the whole roster (symptom: users not
seeing each other on room enter). On a server that DOES emit it,
skipping the read leaves 4 unconsumed bytes per record and produces
the same corruption. Both shapes are wrong in a loop; unconditional
read paired with a server contract that always emits is the only
correct combination.

If you ever need to pair this parser with an older Arcturus that
doesn't emit per-user borderId, the fix is on the server side (add
the cherry-pick), not the parser side. Document any future
trailing-int extension in this same place so the next reader doesn't
re-introduce a bytesAvailable guard "for safety".

### Dropped dead code: `sendWhisperGroupMessage`

`IRoomSession.sendWhisperGroupMessage(userId)` referenced a
`ChatWhisperGroupComposer` that never existed in the codebase and had
zero call sites in the React client. Both the interface declaration
and the broken impl are removed. The real whisper path is
`RoomUnitChatWhisperComposer(recipientName, message, styleId)` —
unchanged.

### TS 5.7+ and Pixi v8 alignment

- `ArrayBufferLike` drift handled with explicit casts in `BinaryReader`
  / `BinaryWriter` / `WsSessionCrypto.randomNonce()` /
  `ArrayBufferToBase64`. The renderer never uses SharedArrayBuffer, so
  these are type-level narrowings only.
- `Container.filters` in Pixi v8 is `Filter[] | readonly Filter[] | null`;
  the AvatarImage filter-stack mutation always goes through the
  spread-array branch now (no single-Filter fallback). `Filter` is
  imported explicitly from pixi.js.
- `ExtendedSprite` casts the renderer to `WebGLRenderer` inside the
  `RendererType.WEBGL` branch so `renderer.gl` /
  `glRenderTarget.resolveTargetFramebuffer` resolve.
- `FurnitureBadgeDisplayVisualization.updateSprite` signature realigned
  to the parent's 2-arg `(scale, layerId)` shape (was a custom 4-arg
  override that broke base-class assignability).
- `TextureUtils.generateImage` casts the extractor's `ImageLike`
  union return to `HTMLImageElement` (the default backend produces
  one).
- `Window.OctaneConfig` declaration in `OctaneConfig.ts` realigned to
  the client's `Record<string, unknown>` type so the merged decls
  agree.
- Empty-tuple composers (`WiredRoomSettingsRequestComposer`,
  `WiredUserVariablesRequestComposer`) annotate the return type
  `(): []` explicitly so `IMessageComposer<[]>` lines up.

### Optional-trailing-field parsers: flat early-return chain

Parsers that read "one tier of optional trailing fields per emulator
release" (UserProfileParser, GetGuestRoomResultMessageParser,
RoomSettingsDataParser, ModeratorUserInfoData, UserSubscriptionParser
…) all use a flat chain:

```ts
if(!wrapper.bytesAvailable) return true;
// block N reads
if(!wrapper.bytesAvailable) return true;
// block N+1 reads
…
```

Defaults come from `flush()`. When the next emulator release ships a
new trailing block, append `if(!wrapper.bytesAvailable) return true;`
+ the new reads. Do NOT nest with `if(wrapper.bytesAvailable) { … }`
— the nested form re-indents the whole chain on every new tier and
is the historical source of brittle reads.

### Bug fix: `SoundManager` volume diff comparison

`onEvent(SETTINGS_UPDATED)` cached `volumeFurniUpdated` /
`volumeTraxUpdated` by comparing `castedEvent.volumeFurni` (percent,
e.g. 75) against `this._volumeFurni` (fraction, e.g. 0.75) — so the
change check almost always reported "updated" for a real settings push
and only reported "unchanged" if the percent matched the fraction by
coincidence (0 / 100 only). Fixed: divide first, compare divided
values, then write. Also tracks `volumeSystemUpdated` for the new
`SOUND_VOLUMES_UPDATED` snapshot invalidation.

### Bug fix: `PetBreedingMessageParser.bytesAvailable < 12`

`bytesAvailable` is a boolean (the wrapper just answers "is there
anything left?"). The pet-breeding parser used to compare it against
`12` as if it were a byte count, which TS 6 caught and which was
also semantically wrong. Replaced with the standard
`if(!wrapper || !wrapper.bytesAvailable) return false;` guard.

## Scripts

```
yarn build              # vite build
yarn compile            # tsc --project ./tsconfig.json --noEmit false
yarn compile:fast       # tsgo (~7× faster, TS 7 preview)
yarn eslint             # lint src + packages/*/src
yarn test               # vitest run
yarn test:watch         # vitest watch
yarn test:coverage      # vitest with v8 coverage
```

## Consumed by

`../octane` consumes this library via `link:../octane-renderer`
(yarn 4 node-modules linker). DO NOT use `yarn link` — it confuses
vite's asset resolution. The client's `vite.config.js` then maps each
`@octane/*` package directly to its source `index.ts` so there's no
build step needed for development.

When making changes to renderer APIs the React client uses, the
client's `feat/react19-*` branches contain consumers — check
`octane/src/hooks/events/` and `octane/src/hooks/{session,rooms}/`
for the React-side bridge code.

## Gotchas

- **`SessionDataManager.getUserData(id)` does NOT exist.** Some legacy
  code in the React client used it under a `getUserData ?` truthy guard;
  the branch was always dead. Only `getUserDataSnapshot()` exists.
- **`bytesAvailable` is a boolean.** The codebase historically had one
  parser (`PetBreedingMessageParser`) that compared it against a
  number — fixed. The wrapper returns "any bytes left?", not a count.
  Use it as a truthy guard or follow with `try {} catch` if you need
  optional reads.
- **Composer `getMessageArray()` return type must match the type
  argument.** `IMessageComposer<[]>` means the function returns `[]`,
  not `any[]`. The two `Wired*RequestComposer`s that ship empty
  payloads each annotate `getMessageArray(): []` explicitly.
- `IRoomSession.sendChatMessage` / `sendShoutMessage` accept an optional
  `chatColour` 3rd arg (was required pre-2.1.1, now optional to match
  the historical call sites in the React client). The implementation
  forwards `undefined` to the composer just fine; pass a value only when
  you need a specific bubble colour.
- `IRoomSession.password` and `IRoomSession.sendBackgroundMessage` are
  now part of the public interface (they always existed on the
  implementation class — interface caught up).
- The renderer is **synchronous**: `EventDispatcher.dispatchEvent` is a
  synchronous loop over listeners. Don't add `await` inside the
  `processEvent` loop — it would change ordering guarantees that
  consumers rely on.
- Workspace package devDeps pin TS at `^6.0.3` so `yarn compile` inside
  any single package keeps working. The root TS 6 is the source of
  truth.

## Sister projects in the same DEV folder

- `../octane` — React 19 client (consumes this lib via link)
- `../Arcturus-Morningstar-Extended` — Java emulator (server side)
- `../OctaneV3-Housekeeping` — Next.js + Prisma admin CMS

## Live furnidata updates: `FurnitureDataReload` (incoming header 10047)

Server-pushed furni name/description changes (pairs with Arcturus'
`FurnitureDataReloadComposer`). `SessionDataManager.applyFurnidataDelta` (pure
`applyFurnidataDeltaTo` in `packages/session/src/furniture/`) patches
`_floorItems`/`_wallItems` by id + the `roomItem/wallItem.name/desc.{id}`
localization keys, then dispatches the window event `octane-localization-updated`
so the client's already-subscribed surfaces refresh. `mode` 0 = delta, 1 =
reload-hint (re-runs `FurnitureDataLoader.init()`). Kept SEPARATE from the
furni-editor's `applyLiveFurnitureNameUpdate`.

**Adding an incoming packet:** id in `IncomingHeader.ts` -> map in
`OctaneMessages.ts` (`this._events.set(IncomingHeader.X, XEvent)`) -> Event +
Parser under `messages/incoming/<area>` + `messages/parser/<area>` -> wire the
barrel chain (`<area>/index.ts` -> parent `index.ts` -> package `src/index.ts`).

**Adding an outgoing composer:** id in `OutgoingHeader.ts` -> register in
`OctaneMessages.ts` (`this._composers.set(OutgoingHeader.X, XComposer)`) -> Composer
under `messages/outgoing/<area>` -> wire the barrel chain. An unregistered composer
makes `getComposerId()` return -1, logs "Unknown Composer", and the packet is
silently DROPPED — the request never reaches the server.

**A feature usually needs BOTH directions registered.** `OctaneMessages` holds two
maps — `_events` (incoming) and `_composers` (outgoing). When a panel is "dead",
audit BOTH, not just `_events`: the inventory Prefixes panel was broken because
`UserPrefixesEvent` (7001, incoming) AND `RequestPrefixesComposer` (7011, outgoing)
were both defined+exported but never `set()` in `OctaneMessages`.

**Gotchas:**
- A branch based on `origin/Dev` may NOT contain the furni-editor slice
  (`FurniDataUpdatedEvent` / `applyLiveFurnitureNameUpdate`) — verify, don't assume.
- Building the renderer in a fresh git worktree needs its own `yarn install`.

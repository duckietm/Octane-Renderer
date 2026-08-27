# Octane Renderer

Octane originated as a fork of [Nitro React](https://github.com/billsonnn/nitro-react) and its companion [Nitro Renderer](https://github.com/billsonnn/nitro-renderer) and is completely independently developed and has no further ties to Billsonnn / Nitro.

## Installation

npm

```
npm install @nitrots/nitro-renderer
```

yarn

```
yarn add @nitrots/nitro-renderer
```

## JSON / JSONC configuration parser

Every configuration file and gamedata file loaded by the renderer (figuredata,
furnidata, productdata, effectmap, avatar actions, etc.) goes through
`@nitrots/utils` → `JsonParser.ts`. The parser supports three modes, selected at
the **host build time** through the compile-time constant `__NITRO_JSON_MODE__`:

| Mode     | Behaviour                                                                 |
|----------|---------------------------------------------------------------------------|
| `legacy` | Strict `JSON.parse` only. Comments / trailing commas raise a clear error. |
| `jsonc`  | Strip comments/trailing commas, then use native `JSON.parse`.             |
| `auto`   | Try strict JSON first, fall back to JSONC. Default when the flag is unset.|

URL hints are still honoured: files ending in `.jsonc` (or served with a
`application/jsonc` content-type) always go through JSONC, regardless of mode.

### Wiring the flag into a host

The renderer does **not** ship its own build for the flag — the host application
(typically [Octane](https://github.com/duckietm/Octane.git)) defines it via
its bundler. Example with Vite:

```js
// vite.config.mjs in the host
export default defineConfig({
    define: {
        __NITRO_JSON_MODE__: JSON.stringify('jsonc')   // or 'legacy' / 'auto'
    }
});
```

If the constant is not defined the parser falls back to `auto`. Removed parser
mode values are not mapped; single-quoted strings and unquoted keys must be converted.

### Using the parser directly

```ts
import { parseConfigJson, fetchConfigJson } from '@nitrots/utils';

const data  = parseConfigJson<MyConfig>(rawText, '/configuration/ui-config.json');
const data2 = await fetchConfigJson<MyConfig>('/configuration/ui-config.jsonc');
```

Errors carry the source URL and, in `legacy` mode, a hint about switching to
JSONC — making misconfigurations easy to diagnose in production logs.

## Split-aware gamedata loader

`@nitrots/utils` also exports `loadGamedata`, the loader that backs every
gamedata consumer in the renderer (FurnitureDataLoader, ProductDataLoader,
EffectAssetDownloadManager, AvatarRenderManager, LocalizationManager). It
accepts either a **single-file URL** (legacy) or a **directory URL** (split
mode) — detected automatically by the trailing slash.

### Directory layout

```
<gamedata-dir>/
  manifest.jsonc            # OPTIONAL — { "tiers": ["core", "custom", "seasonal"] }
  core/
    manifest.jsonc          # REQUIRED — { "files": ["a.jsonc", "b.jsonc", ...] }
    a.jsonc
    b.jsonc
  custom/                   # OPTIONAL tier
    manifest.jsonc
    overrides.jsonc
  seasonal/                 # OPTIONAL tier
    manifest.jsonc
    xmas.jsonc
```

If the directory `manifest.jsonc` is absent, the loader falls back to the
default tier order `core → custom → seasonal`. Each tier is skipped silently
if its `manifest.jsonc` is missing.

### Merge semantics

`mergeGamedata(a, b)` (also exported) implements the rules below; tiers and
files within a tier are merged in order, with later layers overriding
earlier ones:

| Combination                              | Result                                       |
|------------------------------------------|----------------------------------------------|
| Two plain objects                        | recursive merge, key by key                  |
| Two arrays of objects sharing an id key  | merged by id (later overrides earlier)       |
| Two arrays without an id key             | concatenated                                 |
| Anything else                            | later value wins                             |

Recognised id keys (in priority order): `id`, `classname`, `name`. Pass
`mergeArrayIdKeys` in the options object to extend or override them.

### Programmatic usage

```ts
import { loadGamedata, mergeGamedata } from '@nitrots/utils';

// host code never needs to care whether the URL is split or not
const furnidata = await loadGamedata('https://example.com/gamedata/furnidata/');

// merge ad-hoc if you load tiers manually
const merged = mergeGamedata(coreData, customData);
```

A CLI splitter for legacy single-file gamedata lives in the Octane client
repo at `scripts/split-gamedata.mjs` — see the Octane README for usage.

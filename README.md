# ttfx-js

npm distribution of [ttfx](https://github.com/omacom-io/ttfx) (Rust port of
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects)) —
prebuilt binaries for Linux, macOS and Windows, so users need no Rust:

```sh
npx @owais786warsi/ttfx decrypt <<< "hello"
npm i -g @owais786warsi/ttfx
```

Binaries are built from https://github.com/Muhammad-Owais-Warsi/ttfx
(tag `TTFX_REF`, default `v0.3.2-win.0`). All 37 effects ride inside each
binary; `packages/ttfx/bin/ttfx.js` just picks the file for your OS/CPU.

## Layout

- `packages/ttfx` — public package (`ttfx`), launcher + docs
- `packages/ttfx-*` — one platform package per OS/CPU, each holding one binary
- `.github/workflows/release.yml` — builds all targets from the fork tag and
  publishes the 6 packages with provenance

## Release

```sh
# manual first run (inspects artifacts before publishing):
gh workflow run release.yml -f ttfx_ref=v0.3.2-win.0 -f publish=false
# real publish (or push tag v*):
gh workflow run release.yml -f ttfx_ref=v0.3.2-win.0 -f publish=true
```

Needs `NPM_TOKEN` repo secret. To track a new fork tag, bump `TTFX_REF`
default and the `0.3.2-win.0` versions across `packages/*/package.json`.

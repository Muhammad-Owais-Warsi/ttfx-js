# ttfx-node

Terminal text effects for JS CLI builders — chalk-style. Same engine as the
[`ttfx-js`](https://www.npmjs.com/package/ttfx-js) CLI (prebuilt Rust binary,
all 37 effects), exposed as functions: no child processes, no Rust needed.

```sh
npm i ttfx-node
```

```js
import { play, getFrames, listEffects } from 'ttfx-node';

await play('Deploy complete', 'decrypt');                 // animates in your terminal
const frames = getFrames('hi', 'beams', { seed: 1 });    // pure ANSI strings
console.log(listEffects().length);                        // 37
```

## `play(input, effect, opts?)`

Animates in the current terminal, resolves when done. Hides the cursor while
playing and restores it after — including on Ctrl-C, where the promise rejects
with code `INTERRUPTED` instead of leaving a hidden cursor. Under `NO_COLOR`,
non-TTY output, or `noColor: true`, prints the final frame as plain text
(chalk-style), so `--ci` output stays clean.

## `getFrames(input, effect, opts?)`

Renders headlessly to `string[]` — one full screenful per frame, ANSI-coded,
top row first. Sync and deterministic per `seed` (virtual clock; wall time is
never consulted). The canvas derives from the input unless fixed; terminal
size is never read, so output is machine-independent.

```js
const frames = getFrames('hi', 'decrypt', {
  seed: 1,                        // deterministic output
  frameRate: 60,                  // pacing hint for players
  canvasWidth: 40,                // fixed canvas (default: input-sized)
  canvasHeight: 10,
  tabWidth: 4,
  wrapText: false,
  noColor: false,
  xtermColors: false,             // 8-bit palette instead of 24-bit
  maxFrames: 10000,               // hard cap 100000
  randomEffect: false,            // pick from registry (seeded)
  includeEffects: ['wipe'],       // filter for randomEffect
  excludeEffects: ['matrix'],
  effectArgs: ['--typing-speed', '5'],  // ANY effect option, CLI-validated
});
```

`effectArgs` passes straight into the CLI parser, so every one of the 37
effects' options — current and future — works with identical validation and
defaults, and invalid flags throw a descriptive `Error`. Empty/blank input
throws `NO INPUT.`; oversized input, canvas (max 1000×500) or `maxFrames`
throw before the engine runs.

## Recommendations

Building a CLI with this? The patterns that work best:

- **Fire-and-forget → `play()`.** One call animates and cleans up. Call it on
  a fresh line; it reserves its own rows below the prompt and never paints
  over your shell history.
- **Custom player, tests, or pre-baked output → `getFrames()`.** Compute once,
  reuse the array (replay it, write it to a file, snapshot it). Same seed in,
  byte-identical frames out — snapshots never flake.
- **Always pass `seed` in tests.** Omit it in production for variety.
- **Discover options from the CLI:** `npx ttfx-js <effect> --help` lists every
  flag; paste them into `effectArgs` verbatim. Invalid flags throw immediately
  with the CLI's own error text.
- **Respect non-terminals.** `play` prints plain final text under `NO_COLOR`,
  pipes, or CI automatically — test yours with `NO_COLOR=1`. Never gate your
  whole CLI on animation; treat it as decoration around plain output.
- **Handle Ctrl-C.** `play` restores the cursor and rejects with code
  `INTERRUPTED` — catch it and choose your exit code:
  ```js
  try { await play('Working…', 'beams'); }
  catch (e) { if (e.code !== 'INTERRUPTED') throw e; process.exit(130); }
  ```
- **Fix the canvas for layouts.** Default canvases hug the input; if several
  animations share a screen, pass the same `canvasWidth`/`canvasHeight` so
  they align instead of jumping.
- **Mind the frame budget.** `maxFrames` defaults to 10000; a fullscreen
  long-runner can hold tens of MB as strings. For ambient/background loops,
  prefer short inputs and bounded effects (`wipe`, `beams`) over open-ended
  ones.
- **Colors:** 24-bit by default; `xtermColors: true` for limited terminals,
  `noColor: true` for logs.

## Sync with the CLI

`ttfx-node` and the `ttfx-js` CLI build from the same engine tag, and CI
asserts CLI `--parity-dump` and `getFrames` byte-identical per OS — a release
fails if the API ever renders differently. See `versions.json` in
[ttfx-js](https://github.com/Muhammad-Owais-Warsi/ttfx-js) for the mapping.

## Credit

Every effect, the animation engine and the CLI are the work of
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) by
[ChrisBuilds](https://github.com/ChrisBuilds), via the
[ttfx Rust port](https://github.com/omacom-io/ttfx). This package only binds
it for Node — if you like the effects, star the original.

## License

MIT — the binding is MIT; the engine stays under its TTE/ttfx MIT terms
(see THIRD-PARTY-NOTICES in the repo).

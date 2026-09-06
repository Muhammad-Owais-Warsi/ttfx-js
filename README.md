# ttfx-js

Terminal text effects in your terminal, with zero setup. It started as
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects), a
Python library for animating text; was ported to Rust as
[ttfx](https://github.com/omacom-io/ttfx) — a single ~2 MB static binary that
starts in half a millisecond; and this package ships that binary prebuilt for
Linux, macOS and Windows, so `npm` users get everything with no Rust, no
Python, no compiler:

```sh
echo "hello" | npx ttfx-js decrypt
```

All 37 effects ride inside each binary — the JS here only picks the file for
your OS/CPU and hands it your terminal, so speed, rendering and exit codes
are identical to the native build.

## Credit

Every effect, the animation engine and the command-line interface are the
work of [TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects)
by [ChrisBuilds](https://github.com/ChrisBuilds), via the
[ttfx Rust port](https://github.com/omacom-io/ttfx) (Windows support from
[this fork](https://github.com/Muhammad-Owais-Warsi/ttfx)). This repository
only packages their prebuilt binaries for npm — see THIRD-PARTY-NOTICES for
the full attribution. If you like the effects, star the original.

## Installation

```sh
npx ttfx-js decrypt            # no install at all, runs once (pipe text in)
npm i ttfx-js                  # local to a project, then npx ttfx-js ...
npm i -g ttfx-js               # global, adds the ttfx command everywhere
```

No postinstall build, no peer dependencies. The platform binary (~1 MB
download) arrives as an optional dependency npm selects automatically.

## Usage

```
<producer> | ttfx [terminal options] <effect> [effect options]
```

A few to try (same in PowerShell, cmd and bash):

```sh
echo "hello" | npx ttfx-js decrypt
echo "hello" | npx ttfx-js beams
git log --oneline -10 | npx ttfx-js matrix
echo "surprise me" | npx ttfx-js --random-effect
npx ttfx-js decrypt --help    # options for one effect
```

`npx ttfx-js --help` prints all 37 effects and the terminal options:

```
Terminal text effects (Rust port of terminaltexteffects)

Usage: ttfx [OPTIONS] [COMMAND]

Commands:
  beams            Create beams which travel over the canvas illuminating the characters behind them
  binarypath       Binary representations of each character move towards the home coordinate of the character
  blackhole        Characters are consumed by a black hole and explode outwards
  bouncyballs      Characters are bouncy balls falling from the top of the canvas
  bubbles          Characters are formed into bubbles that float down and pop
  burn             Burns vertically in the canvas
  colorshift       Display a gradient that shifts colors across the terminal
  crumble          Characters lose color and crumble into dust, vacuumed up, and reformed
  decrypt          Display a movie style decryption effect
  ...
  waves            Waves travel across the terminal leaving behind the characters
  wipe             Wipes the text across the terminal to reveal characters

Options:
      --frame-rate <FRAME_RATE>  [default: 60]
      --canvas-width <CANVAS_WIDTH>  [default: -1]
      --canvas-height <CANVAS_HEIGHT>  [default: -1]
      --anchor-canvas <ANCHOR_CANVAS>  [default: sw]
      --anchor-text <ANCHOR_TEXT>  [default: sw]
      --seed <SEED>              Seed for the random number generator (deterministic within ttfx)
  -R, --random-effect            Run a random effect
  -h, --help                     Print help
```

(The binary prints its own name in `Usage:` — `ttfx` after a global install.)

## License

MIT — see [LICENSE](LICENSE). The shipped binaries stay under their own MIT
terms from TTE and ttfx, reproduced in [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES).

# ttfx (npm)

Terminal text effects as a single static binary. No Rust needed:

```sh
npx ttfx-js decrypt <<< "hello"
echo "hello" | npx ttfx-js beams
npm i -g ttfx-js
```

All 37 effects included. Usage matches the Rust binary:

```
<producer> | ttfx [terminal options] <effect> [effect options]

ttfx --help                 # all 37 effects and the terminal options
ttfx <effect> --help        # options for one effect
ttfx --random-effect        # surprise me
```

## How it works

This package ships prebuilt `ttfx` binaries (Linux/macOS/Windows) as optional
platform packages. `bin/ttfx.js` picks the one for your machine and runs it
with your terminal attached, so rendering, speed (~3 MB binary, millisecond
startup) and exit codes are identical to the native build.

## Credit where it's due

The effects, animation engine and CLI are the work of
[TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects) by
[ChrisBuilds](https://github.com/ChrisBuilds), via the
[ttfx Rust port](https://github.com/omacom-io/ttfx) (Windows support from
[this fork](https://github.com/Muhammad-Owais-Warsi/ttfx)). This repo only
packages their prebuilt binaries for npm — see THIRD-PARTY-NOTICES.

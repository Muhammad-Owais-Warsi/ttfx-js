# ttfx docs site

Vite multi-page site deployed to GitHub Pages (`docs/**` pushes build `docs/dist`).

```sh
cd docs
npm install
npm run dev      # http://localhost:5178
npm run build    # dist/ (wired for the /ttfx-js/ subpath via relative URLs)
```

Notes:

- `src/data/cli.json` is generated from the real binary — per-effect
  `--help` for all 37 effects. Regenerate with the fork's release binary:
  loop `ttfx <effect> --help` into the same shape
  (`{ main, effects: [{ name, help }] }`).
- `public/og.png` is the social card + favicon. `og:image`/`twitter:image`
  use the absolute Pages URL; update them if the domain ever changes.
- `public/art.txt` is the hero wordmark art, fetched at runtime.
- The hero loops the engine live (`ttfx-node/web` + canvas); keep it
  dependency-light — no frameworks, no terminal emulator.

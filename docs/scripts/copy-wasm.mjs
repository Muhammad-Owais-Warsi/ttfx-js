// Copies the ttfx wasm binary into public/ so `init('/ttfx_wasm_bg.wasm')`
// can fetch it in dev and in the production build. Runs via predev/prebuild.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '..', 'package.json'));
// './web' is an exported subpath; the wasm sits next to it.
const webEntry = require.resolve('ttfx-node/web');
const wasmPkg = join(dirname(webEntry), 'wasm', 'ttfx_wasm_bg.wasm');
mkdirSync(join(here, '..', 'public'), { recursive: true });
copyFileSync(wasmPkg, join(here, '..', 'public', 'ttfx_wasm_bg.wasm'));
console.log('wasm copied to public/ttfx_wasm_bg.wasm');

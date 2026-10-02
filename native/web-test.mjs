// Smoke test for the wasm-pack web artifact (no DOM needed: initSync from
// fs bytes). Mirrors omarchy.org's etch.js usage: Session + step + fill.
//
// Usage: node web-test.mjs [wasm-dir]   (default: ./wasm)

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = process.argv[2]
  ?? join(dirname(fileURLToPath(import.meta.url)), 'wasm');
const glue = await import(pathToFileURL(join(dir, 'ttfx_wasm.js')).href);
glue.initSync({ module: readFileSync(join(dir, 'ttfx_wasm_bg.wasm')) });

// Without this a wasm panic only prints "unreachable": the console hook is
// how Rust's own panic message reaches the terminal.
const { logError, __wbindgen_throw } = glue;
globalThis.addEventListener?.('error', (e) => {
  if (e.error) logError(String(e.error));
  else logError(e.message);
});
console.onerror = logError;
globalThis.addEventListener?.('unhandledrejection', (e) => logError(String(e.reason)));

const { Session, effect_catalog } = glue;
const HIDDEN = 32;

function run(input, effect, seed, palette) {
  // Real grid dims: (0, 0) is a degenerate terminal, not "auto".
  const s = new Session(input, effect, 40, 12, seed, 60, palette);
  const frames = [];
  for (let i = 0; i < 100000 && s.step(); i++) {
    const n = s.width() * s.height();
    assert.ok(n > 0, 'empty grid');
    const buf = {
      symbols: new Uint32Array(n),
      fg: new Uint32Array(n),
      bg: new Uint32Array(n),
      flags: new Uint8Array(n),
    };
    s.fill(buf.symbols, buf.fg, buf.bg, buf.flags);
    assert.equal(buf.symbols.length, n);
    frames.push(buf);
  }
  s.free();
  assert.ok(frames.length > 0, `${effect} produced no frames`);
  return frames;
}

function visibleText(frame) {
  let out = '';
  for (let i = 0; i < frame.symbols.length; i++) {
    if (frame.flags[i] & HIDDEN) continue;
    const c = frame.symbols[i];
    if (c !== 0 && c !== 32) out += String.fromCodePoint(c);
  }
  return out;
}

// catalog: 37 effects
const catalog = JSON.parse(effect_catalog());
assert.equal(catalog.length, 37);
assert.ok(catalog.some((e) => e.name === 'decrypt'));

// resolving effect ends on the input; deterministic per seed
const a = run('hello', 'decrypt', 1);
assert.ok(visibleText(a.at(-1)).includes('hello'));
const b = run('hello', 'decrypt', 1);
assert.equal(a.length, b.length);
assert.deepEqual([...a.at(-1).symbols], [...b.at(-1).symbols]);

// palette path (omarchy.org passes one)
const p = run('OMARCHY', 'decrypt', 1, '#daecc6,#bbdd97,#9ece6a,#678549,#39482e');
assert.ok(visibleText(p.at(-1)).includes('OMARCHY'));

// unknown effect throws like the CLI errors
assert.throws(() => new Session('hi', 'nope', 0, 0, 1, 60), /unknown effect/);
// blank input throws like the CLI's NO INPUT.
assert.throws(() => new Session('  ', 'decrypt', 0, 0, 1, 60), /NO INPUT/);

console.log(`wasm smoke OK: ${a.length} decrypt frames, catalog ${catalog.length}`);

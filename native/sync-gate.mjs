// Sync gate: CLI --parity-dump and getFrames must be byte-identical for the
// same input/seed. Run in CI on each OS (never compare across libm
// boundaries): node sync-gate.mjs <path-to-ttfx-binary>
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { getFrames } from './index.js';

const bin = process.argv[2];
if (!bin) {
  console.error('usage: node sync-gate.mjs <ttfx-binary>');
  process.exit(2);
}

const cases = [
  { input: 'hello', effect: 'decrypt', opts: { seed: 1 } },
  { input: 'hello world', effect: 'beams', opts: { seed: 7 } },
  { input: 'hello', effect: 'wipe', opts: { seed: 3, effectArgs: ['--wipe-delay', '5'] } },
  { input: 'hello', effect: 'decrypt', opts: { seed: 1, effectArgs: ['--typing-speed', '5'] } },
  { input: 'hi', effect: 'wipe', opts: { seed: 5, randomEffect: true, includeEffects: ['wipe'] } },
];

function cliFrames(input, effect, opts) {
  const argv = [
    '--ignore-terminal-dimensions',
    '--parity-dump',
    '--seed',
    String(opts.seed),
    ...(opts.randomEffect ? ['--random-effect'] : []),
    ...(opts.randomEffect && opts.includeEffects ? ['--include-effects', ...opts.includeEffects] : []),
    ...(opts.randomEffect ? [] : [effect]),
    ...(opts.effectArgs || []),
  ];
  // No encoding option: stdout arrives as a UTF-8 string (frames are valid
  // UTF-8), converted back to bytes for byte-precise record parsing.
  // ('buffer' is not a valid execFileSync encoding.)
  const text = execFileSync(bin, argv, { input, maxBuffer: 256 * 1024 * 1024 });
  const out = Buffer.from(text, 'utf8');
  // Length-prefixed records, parsed byte-precise (frames may contain \n).
  const frames = [];
  let pos = 0;
  while (pos < out.length) {
    const nl = out.indexOf(0x0a, pos);
    if (nl === -1) break;
    const len = parseInt(out.subarray(pos, nl).toString(), 10);
    if (!Number.isFinite(len)) break;
    const start = nl + 1;
    frames.push(out.subarray(start, start + len));
    pos = start + len + 1;
  }
  return frames.map((b) => b.toString('utf8'));
}

let failed = 0;
for (const c of cases) {
  const a = cliFrames(c.input, c.effect, c.opts);
  const b = getFrames(c.input, c.effect, c.opts);
  const ha = createHash('sha256').update(a.join('\n')).digest('hex');
  const hb = createHash('sha256').update(b.join('\n')).digest('hex');
  const ok = a.length === b.length && ha === hb;
  console.log(`${ok ? 'GATE-OK  ' : 'GATE-FAIL'} ${c.effect} seed=${c.opts.seed} frames=${a.length}/${b.length}`);
  if (!ok) failed += 1;
}
process.exit(failed === 0 ? 0 : 1);

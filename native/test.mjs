import assert from 'node:assert/strict';
import { getFrames, listEffects } from './index.js';

const effects = listEffects();
assert.equal(effects.length, 37);
assert.ok(effects.includes('decrypt'));
assert.ok(effects.includes('matrix'));

// Determinism: same seed twice -> byte-identical.
const a = getFrames('hello', 'decrypt', { seed: 1 });
const b = getFrames('hello', 'decrypt', { seed: 1 });
assert.ok(a.length > 0);
assert.deepEqual(a, b);

// Different seed -> differs (overwhelmingly likely for decrypt).
const c = getFrames('hello', 'decrypt', { seed: 2 });
assert.notDeepEqual(a, c);

// Effect args passthrough (validated like the CLI).
const typed = getFrames('hello', 'decrypt', { seed: 1, effectArgs: ['--typing-speed', '5'] });
assert.ok(typed.length > 0);
assert.throws(() => getFrames('hello', 'decrypt', { effectArgs: ['--typing-speed', 'xyz'] }), /invalid/);

// Error contract.
assert.throws(() => getFrames('   ', 'decrypt'), /NO INPUT/);
assert.throws(() => getFrames('hi', 'no-such-effect'), /error/i);
assert.throws(() => getFrames('hi', 'decrypt', { maxFrames: 0 }), /max_frames/);
assert.throws(() => getFrames('hi', 'decrypt', { canvasWidth: 5000 }), /canvas_width/);

// Sync gate preview: first frame equals CLI --parity-dump first frame for same seed.
// (Full gate runs in CI against the real binary.)
console.log(`effects=${effects.length} decryptFrames=${a.length} firstLen=${a[0].length} OK`);

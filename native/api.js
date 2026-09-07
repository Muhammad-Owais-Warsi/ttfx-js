"use strict";
// Chalk-style player over the pure binding. The engine stays sync and
// TTY-free; all terminal interaction (pacing, cursor, Ctrl-C, NO_COLOR)
// lives here in JS.

const { getFrames, listEffects } = require('./index.js');

const ANSI_RE = /[\u001B\u009B][[\]()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PRZcf-nqry=><]/g;

/**
 * Strip ANSI escape sequences, leaving plain text.
 * @param {string} s - A frame (or any ANSI-coded string).
 * @returns {string} The visible text, e.g. `stripAnsi(frame)` → `'hi'`.
 * @example
 * ```js
 * const { getFrames, stripAnsi } = require('ttfx-node');
 * const last = getFrames('hi', 'beams', { seed: 1 }).at(-1);
 * console.log(stripAnsi(last)); // 'hi'
 * ```
 */
function stripAnsi(s) {
  return s.replace(ANSI_RE, '');
}

function shouldColorize(opts) {
  if (opts && opts.noColor) return false;
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') return false;
  return true;
}

/**
 * Animate text in the current terminal — the one-call, chalk-style entry
 * point. Call it on a fresh line: it reserves its own rows below the prompt,
 * hides the cursor while playing, and restores it afterwards.
 *
 * Under `NO_COLOR`, piped output, or `noColor: true`, prints the final frame
 * as plain text instead, so `--ci` runs stay clean without branching.
 * @param {string} input - Text to animate. Blank input throws `NO INPUT.`.
 * @param {string} effect - Any of the 37 effect names (see `listEffects()`).
 * @param {object} [opts] - `seed`, `frameRate` (0 = unpaced), `canvasWidth`,
 * `canvasHeight`, `effectArgs` (e.g. `['--typing-speed', '5']`), and any
 * `getFrames` option. Discover flags with `npx ttfx-js <effect> --help`.
 * @returns {Promise<void>} Resolves when the animation finishes.
 * @throws Rejects with code `INTERRUPTED` on Ctrl-C, after restoring the
 * cursor — catch it and choose your exit code.
 * @example
 * ```js
 * const { play } = require('ttfx-node');
 * try {
 *   await play('Deploy complete', 'decrypt', { seed: 1 });
 * } catch (e) {
 *   if (e.code !== 'INTERRUPTED') throw e;
 *   process.exit(130);
 * }
 * ```
 */
async function play(input, effect, opts = {}) {
  const frames = getFrames(input, effect, opts);
  if (frames.length === 0) return;
  const out = process.stdout;
  if (!out.isTTY || !shouldColorize(opts)) {
    out.write(stripAnsi(frames[frames.length - 1]) + '\n');
    return;
  }
  const rate = opts.frameRate === 0 ? 0 : 1000 / (opts.frameRate || 60);
  // All frames share one canvas, so one row count. Reserve that many lines
  // below the prompt (like the binary's canvas prep), then redraw in place
  // with relative moves only — never \x1b[H, which would paint over the
  // shell history above.
  const rows = frames[0].split('\n').length;
  const rewind = rows > 1 ? `\x1b[${rows - 1}A\r` : '\r';
  let interrupted = false;
  const onSigint = () => {
    interrupted = true;
  };
  process.on('SIGINT', onSigint);
  try {
    out.write('\x1b[?25l' + '\n'.repeat(rows) + `\x1b[${rows}A`);
    for (let i = 0; i < frames.length; i++) {
      if (interrupted) {
        const e = new Error('interrupted');
        e.code = 'INTERRUPTED';
        throw e;
      }
      if (i > 0) out.write(rewind);
      out.write(frames[i]);
      if (rate > 0) await new Promise((r) => setTimeout(r, rate));
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    out.write('\x1b[?25h\n');
  }
}

module.exports = { getFrames, listEffects, play, stripAnsi };

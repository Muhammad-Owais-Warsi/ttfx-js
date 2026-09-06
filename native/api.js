"use strict";
// Chalk-style player over the pure binding. The engine stays sync and
// TTY-free; all terminal interaction (pacing, cursor, Ctrl-C, NO_COLOR)
// lives here in JS.

const { getFrames, listEffects } = require('./index.js');

const ANSI_RE = /[\u001B\u009B][[\]()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PRZcf-nqry=><]/g;

function stripAnsi(s) {
  return s.replace(ANSI_RE, '');
}

function shouldColorize(opts) {
  if (opts && opts.noColor) return false;
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') return false;
  return true;
}

/**
 * Play an effect in this terminal, resolving when done.
 * Non-TTY or NO_COLOR: prints the final frame as plain text (chalk-style).
 * Rejects with code 'INTERRUPTED' on Ctrl-C after restoring the cursor.
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
  let interrupted = false;
  const onSigint = () => {
    interrupted = true;
  };
  process.on('SIGINT', onSigint);
  try {
    out.write('\x1b[?25l');
    for (const frame of frames) {
      if (interrupted) {
        const e = new Error('interrupted');
        e.code = 'INTERRUPTED';
        throw e;
      }
      out.write('\x1b[H' + frame);
      if (rate > 0) await new Promise((r) => setTimeout(r, rate));
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    out.write('\x1b[?25h\n');
  }
}

module.exports = { getFrames, listEffects, play, stripAnsi };

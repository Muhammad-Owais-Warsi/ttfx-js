// ttfx-node browser entry: the same engine as the Node binding, compiled to
// WebAssembly, painted straight to <canvas> — no terminal emulator, no ANSI.
//
// import init, { playOnCanvas, listEffects } from 'ttfx-node/web';
// await init();                       // loads ./wasm/ttfx_wasm_bg.wasm once
// const anim = playOnCanvas(canvas, 'Ship it', 'decrypt', { seed: 7 });
// anim.done.then(() => console.log('settled'));
// anim.cancel();                        // stop early

import initWasm, {
  Session,
  effect_catalog,
  field_band_index,
} from './wasm/ttfx_wasm.js';

export { Session, effect_catalog, field_band_index };
export default initWasm;
export { initWasm as init };

const HIDDEN = 32;

/** Measure one monospace cell for a CSS font string. */
export function measureCell(ctx, font) {
  ctx.save();
  ctx.font = font;
  const cellW = ctx.measureText('M').width;
  // Full-cell height for a monospace face at this size.
  const cellH = ctx.measureText('Mg').actualBoundingBoxAscent
    + ctx.measureText('Mg').actualBoundingBoxDescent;
  ctx.restore();
  return { cellW, cellH };
}

/**
 * Paint one packed frame. Buffers are caller-owned and reused across frames:
 * create them once at `width * height` and pass them every frame.
 */
export function paintFrame(ctx, session, buf, metrics, opts = {}) {
  const w = session.width();
  const h = session.height();
  const n = w * h;
  if (n === 0) return;
  session.fill(buf.symbols, buf.fg, buf.bg, buf.flags);
  const { cellW, cellH } = metrics;
  if (!opts.transparent) {
    ctx.fillStyle = opts.background ?? '#000000';
    ctx.fillRect(0, 0, w * cellW, h * cellH);
  } else {
    ctx.clearRect(0, 0, w * cellW, h * cellH);
  }
  ctx.font = opts.font;
  ctx.textBaseline = 'top';
  let run = -1;
  for (let i = 0; i < n; i++) {
    if (buf.flags[i] & HIDDEN) continue;
    const sym = buf.symbols[i];
    if (sym === 32 || sym === 0) continue;
    const rgb = buf.fg[i] & 0xffffff;
    if (rgb !== run) {
      run = rgb;
      ctx.fillStyle = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`;
    }
    ctx.fillText(
      String.fromCodePoint(sym),
      (i % w) * cellW,
      ((i / w) | 0) * cellH,
    );
  }
}

/** Allocate (or grow) reusable frame buffers for a W*H grid. */
export function makeBuffers(w, h, prev) {
  const n = w * h;
  if (prev && prev.symbols.length >= n) return prev;
  const { Uint32Array: U32, Uint8Array: U8 } = globalThis;
  return {
    symbols: new U32(n),
    fg: new U32(n),
    bg: new U32(n),
    flags: new U8(n),
  };
}

/**
 * Animate text on a <canvas>: create the Session, size the canvas to the
 * grid, and step it on requestAnimationFrame paced at `frameRate`.
 *
 * Options mirror the Node `play()` surface where they apply: seed, frameRate,
 * canvasWidth / canvasHeight (fixed grid, default hugs the input).
 * Effect knobs travel in `palette`, `background`, `bands` like the wasm
 * Session: { palette: '#a,#b,..', background: '#000000', bands: false }.
 * Plus painter opts: { font, transparent, cellPx }.
 *
 * Returns { done: Promise<void>, cancel(): void }.
 */
export function playOnCanvas(canvas, input, effect, opts = {}) {
  const seed = opts.seed;
  const frameRate = opts.frameRate ?? 60;
  // The Session has no input-hugging default: (0, 0) is a degenerate
  // terminal, so size the grid from the text unless fixed explicitly.
  const lines = String(input).split('\n');
  const widest = lines.reduce((m, l) => Math.max(m, [...l].length), 1);
  const columns = opts.canvasWidth ?? Math.max(widest + 4, 10);
  const rows = opts.canvasHeight ?? Math.max(lines.length + 4, 6);
  const session = new Session(
    input,
    effect,
    columns,
    rows,
    seed,
    frameRate,
    opts.palette,
    opts.background,
    opts.bands ?? false,
  );
  const ctx = canvas.getContext('2d');
  const dpr = globalThis.devicePixelRatio || 1;
  const fontPx = opts.cellPx ?? 16;
  const font = `${fontPx}px ${opts.font ?? '"JetBrains Mono", ui-monospace, monospace'}`;
  const { cellW, cellH } = measureCell(ctx, font);
  const metrics = { cellW, cellH };
  const w = session.width();
  const h = session.height();
  canvas.width = Math.max(1, Math.round(w * cellW * dpr));
  canvas.height = Math.max(1, Math.round(h * cellH * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let buf = makeBuffers(w, h);
  let raf = 0;
  let cancelled = false;
  let freed = false;
  let resolve;
  const done = new Promise((res) => { resolve = res; });
  // Freeing twice traps ("null pointer passed to rust") and repeated traps
  // corrupt the wasm heap, which wedges every later Session. One free only.
  const freeOnce = () => {
    if (!freed) {
      freed = true;
      session.free();
    }
  };
  let last = 0;
  const interval = 1000 / Math.max(1, frameRate);
  const tick = (now) => {
    if (cancelled) return;
    if (now - last >= interval) {
      last = now;
      // A throwing step ends the animation instead of wedging the loop.
      let alive = true;
      try {
        alive = session.step();
      } catch {
        alive = false;
      }
      if (!alive) {
        try {
          paintFrame(ctx, session, buf, metrics, opts);
        } catch {
          /* engine already gone; leave the last good frame up */
        }
        freeOnce();
        resolve();
        return;
      }
      const nw = session.width();
      const nh = session.height();
      if (nw !== w || nh !== h) {
        buf = makeBuffers(nw, nh, buf);
        canvas.width = Math.max(1, Math.round(nw * cellW * dpr));
        canvas.height = Math.max(1, Math.round(nh * cellH * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      paintFrame(ctx, session, buf, metrics, opts);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    done,
    cancel() {
      cancelled = true;
      cancelAnimationFrame(raf);
      freeOnce();
      resolve();
    },
  };
}

/** Effect catalog as parsed JSON: [{ name, about }]. */
export function listEffects() {
  return JSON.parse(effect_catalog());
}

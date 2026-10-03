import { playOnCanvas } from 'ttfx-node/web';
import { FONT, engine, sleep } from './shared';

const HERO_MS = 3000;
const ART_URL = 'art.txt';
// Amber field palette so every effect paints vividly on the dark page.
const PALETTE = '#ffe9c4,#ffd58a,#f5b942,#f59e0b,#92400e';
const BG = '#0a0a10';
const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
// Each effect plays to its natural completion; the cap only guards runaways.
const SAFETY_MS = 25000;
// Full rotation, most prominent first. Sparse/ambient ones sit at the end;
// the per-effect cap keeps their slots short.
const HERO_FX = [
  'beams',
  'sweep',
  'laseretch',
  'crumble',
  'decrypt',
  'burn',
  'waves',
  'wipe',
  'fireworks',
  'slide',
  'slice',
  'pour',
  'rain',
  'scattered',
  'spray',
  'errorcorrect',
  'expand',
  'highlight',
  'middleout',
  'orbittingvolley',
  'overflow',
  'print',
  'randomsequence',
  'smoke',
  'synthgrid',
  'unstable',
  'vhstape',
  'binarypath',
  'blackhole',
  'bouncyballs',
  'bubbles',
  'matrix',
  'rings',
  'spotlights',
  'swarm',
  'thunderstorm',
];
// Last time the hero moved to a new effect. A watchdog below reloads if the
// loop ever wedges. Capped at 2 reloads per session so a deterministic crash
// can't loop forever. Stall ceiling sits well above any legit full play.
let lastTransition = Date.now();
const STALL_MS = 60000;
try {
  const reloads = Number(sessionStorage.getItem('hero-reloads') ?? 0);
  setInterval(() => {
    if (Date.now() - lastTransition > STALL_MS && reloads < 2) {
      sessionStorage.setItem('hero-reloads', String(reloads + 1));
      location.reload();
    }
  }, 2000);
} catch {
  /* storage unavailable: watchdog stays armed without the cap */
  setInterval(() => {
    if (Date.now() - lastTransition > STALL_MS) location.reload();
  }, 2000);
}

const canvas = document.getElementById('hero') as HTMLCanvasElement;
const hdg = document.getElementById('hero-effect') as HTMLElement;

async function playOnce(text: string, effect: string, seed: number, maxMs: number) {
  const anim = playOnCanvas(canvas, text || 'hi', effect, {
    seed,
    font: FONT,
    transparent: true,
    palette: PALETTE,
    background: BG,
    bands: true,
  });
  // Progress must never depend on anim.done settling: race it so quick
  // effects advance early, but the cap alone moves us on even if done hangs.
  await Promise.race([anim.done.catch(() => {}), sleep(maxMs)]);
  try {
    anim.cancel();
  } catch {
    /* already freed / already gone */
  }
}

// The loop survives tab switches: rAF pauses while hidden, so the current
// animation simply waits; on visibility it resumes. If the tab was hidden
// long enough that the cap elapsed, cancel fires and the loop moves on —
// either way it never gets stuck.
async function heroLoop(art: string, effects: string[]) {
  let i = 0;
  for (;;) {
    const effect = effects[i % effects.length];
    i++;
    lastTransition = Date.now();
    hdg.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = effect;
    hdg.append(b);
    try {
      await playOnce(art, effect, (i * 7919) % 100000, SAFETY_MS);
    } catch {
      /* one bad effect never kills the loop */
    }
  }
}

async function boot() {
  try {
    await engine();
  } catch (err) {
    const status = document.getElementById('hero-effect') as HTMLElement;
    status.textContent = 'engine failed to load — ' + String((err as Error)?.message ?? err);
    return;
  }
  let art = 'terminal text fx';
  try {
    const res = await fetch(ART_URL);
    if (res.ok) art = (await res.text()).trimEnd() || art;
  } catch {
    /* fall back to plain text */
  }
  await heroLoop(art, HERO_FX);
}

void boot();

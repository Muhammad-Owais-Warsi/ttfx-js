import type { FramesOptions } from './index';

export type { FramesOptions };

/**
 * Every effect the engine can render. Pick any name for {@link getFrames} or
 * {@link play} — discover per-effect flags with
 * `npx ttfx-js <effect> --help` and pass them via `effectArgs`.
 *
 * @example
 * ```js
 * import { listEffects } from 'ttfx-node';
 * console.log(listEffects().length); // 37
 * ```
 */
export type EffectName =
  | 'beams' | 'binarypath' | 'blackhole' | 'bouncyballs' | 'bubbles'
  | 'burn' | 'colorshift' | 'crumble' | 'decrypt' | 'errorcorrect'
  | 'expand' | 'fireworks' | 'highlight' | 'laseretch' | 'matrix'
  | 'middleout' | 'orbittingvolley' | 'overflow' | 'pour' | 'print'
  | 'rain' | 'randomsequence' | 'rings' | 'scattered' | 'slice'
  | 'slide' | 'smoke' | 'spotlights' | 'spray' | 'swarm' | 'sweep'
  | 'synthgrid' | 'thunderstorm' | 'unstable' | 'vhstape' | 'waves'
  | 'wipe';

export interface PlayOptions extends FramesOptions {
  /**
   * Print the final frame as plain text instead of animating.
   * `play` already does this automatically under `NO_COLOR` or non-TTY output.
   * @defaultValue false
   */
  noColor?: boolean;
  /**
   * Replay in the previous run's rows instead of reserving new lines below
   * the prompt. Requires the same text (or equal explicit
   * `canvasWidth`/`canvasHeight`) as the previous run. Omit on the first
   * call of a loop, set on the rest.
   *
   * @example
   * ```js
   * let first = true;
   * for (const effect of ['decrypt', 'beams', 'wipe']) {
   *   await play(text, effect, { seed: 1, reuseCanvas: !first });
   *   first = false;
   * }
   * ```
   * @defaultValue false
   */
  reuseCanvas?: boolean;
}

/**
 * Names of all 37 effects, in registry order.
 *
 * @example
 * ```js
 * import { listEffects } from 'ttfx-node';
 * if (!listEffects().includes('decrypt')) throw new Error('engine mismatch');
 * ```
 */
export declare function listEffects(): EffectName[];

/**
 * Render an effect headlessly: one ANSI string per frame, top row first.
 *
 * Sync and deterministic — the same `seed` yields byte-identical frames on
 * any machine (virtual clock; terminal size is never read). Reuse the array:
 * replay it, snapshot it, or drive a custom player with it.
 *
 * @param input - Text to animate. Blank input throws.
 * @param effect - Any {@link EffectName}; unknown names throw with the CLI's
 * error text.
 * @param options - All fields optional:
 * @param options.seed - Deterministic output. Omit for OS entropy.
 * @param options.frameRate - Pacing hint for players; engine timing otherwise.
 * @defaultValue 60
 * @param options.canvasWidth - Fixed canvas columns (default: hugs the input).
 * @param options.canvasHeight - Fixed canvas rows (default: hugs the input).
 * @param options.tabWidth - Tab expansion width.
 * @defaultValue 4
 * @param options.wrapText - Wrap long lines into the canvas.
 * @defaultValue false
 * @param options.noColor - Strip color, keep layout.
 * @defaultValue false
 * @param options.xtermColors - 8-bit palette instead of 24-bit.
 * @defaultValue false
 * @param options.maxFrames - Safety cap (hard max 100000).
 * @defaultValue 10000
 * @param options.randomEffect - Pick from the registry (seeded) instead of
 * `effect`. Combine with `includeEffects`/`excludeEffects` to filter.
 * @param options.effectArgs - Any effect flag, CLI-validated, e.g.
 * `['--typing-speed', '5']`. Discover flags with
 * `npx ttfx-js <effect> --help`.
 * @returns Frames as ANSI strings.
 * @throws `NO INPUT.` for blank input; CLI error text for unknown effects,
 * invalid flags, or oversized input/canvas.
 *
 * @example
 * ```js
 * import { getFrames } from 'ttfx-node';
 *
 * const frames = getFrames('Deploy complete', 'decrypt', { seed: 1 });
 * for (const frame of frames) {
 *   process.stdout.write('\x1b[H' + frame);
 *   await new Promise((r) => setTimeout(r, 1000 / 60));
 * }
 * ```
 */
export declare function getFrames(input: string, effect: EffectName | string, options?: FramesOptions): string[];

/**
 * Strip ANSI escape sequences, leaving plain text.
 *
 * @example
 * ```js
 * import { getFrames, stripAnsi } from 'ttfx-node';
 * const last = getFrames('hi', 'beams', { seed: 1 }).at(-1);
 * console.log(stripAnsi(last)); // 'hi'
 * ```
 */
export declare function stripAnsi(s: string): string;

/**
 * Animate text in the current terminal — the one-call, chalk-style entry
 * point. Reserves its own rows below the prompt, hides the cursor while
 * playing, paces at `frameRate`, and restores the cursor afterwards.
 *
 * Call it on a fresh line. Under `NO_COLOR`, piped output, or
 * `noColor: true`, prints the final frame as plain text instead (so `--ci`
 * runs stay clean without branching your code).
 *
 * @param input - Text to animate. Blank input throws `NO INPUT.`.
 * @param effect - Any {@link EffectName}.
 * @param opts - {@link getFrames} options plus `noColor`; `frameRate: 0`
 * disables pacing.
 * @throws Rejects with code `INTERRUPTED` on Ctrl-C, after restoring the
 * cursor. Catch it and choose your exit code:
 * @example
 * ```js
 * import { play } from 'ttfx-node';
 *
 * try {
 *   await play('Deploy complete', 'decrypt', { seed: 1 });
 * } catch (e) {
 *   if (e.code !== 'INTERRUPTED') throw e;
 *   process.exit(130);
 * }
 * ```
 */
export declare function play(input: string, effect: EffectName | string, opts?: PlayOptions): Promise<void>;

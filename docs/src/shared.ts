import init, { listEffects } from 'ttfx-node/web';
import cliData from './data/cli.json';

export const FONT = '"JetBrains Mono", ui-monospace, monospace';

let ready: Promise<void> | null = null;

/** Initialize the wasm engine once per page. Relative URL: works at domain root and under /ttfx-js/. */
export function engine(): Promise<void> {
  if (!ready) ready = init('ttfx_wasm_bg.wasm').then(() => undefined);
  return ready;
}

export function effectNames(): string[] {
  return (listEffects() as Array<{ name: string; about: string }>).map((e) => e.name);
}

export function effectAbout(): Map<string, string> {
  return new Map(
    (listEffects() as Array<{ name: string; about: string }>).map((e) => [e.name, e.about]),
  );
}

export function effectHelps(): Map<string, string> {
  return new Map(
    (cliData.effects as Array<{ name: string; help: string }>).map((e) => [e.name, e.help]),
  );
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

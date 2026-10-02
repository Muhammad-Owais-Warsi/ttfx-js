import type { EffectName } from './api';

export interface WebPlayOptions {
  seed?: number;
  frameRate?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  palette?: string;
  background?: string;
  bands?: boolean;
  font?: string;
  cellPx?: number;
  transparent?: boolean;
}

export interface FrameBuffers {
  symbols: Uint32Array;
  fg: Uint32Array;
  bg: Uint32Array;
  flags: Uint8Array;
}

export interface CellMetrics {
  cellW: number;
  cellH: number;
}

/** Initialize the wasm engine. Call once before anything else. */
export declare function init(path?: string | URL): Promise<unknown>;
export default init;

export declare class Session {
  constructor(
    input: string,
    effect: EffectName | string,
    columns: number,
    rows: number,
    seed?: number,
    frameRate?: number,
    palette?: string,
    background?: string,
    bands?: boolean,
  );
  step(): boolean;
  done(): boolean;
  width(): number;
  height(): number;
  fill(
    symbols: Uint32Array,
    fg: Uint32Array,
    bg: Uint32Array,
    flags: Uint8Array,
  ): void;
  free(): void;
}

export declare function effect_catalog(): string;
export declare function field_band_index(t: number): number;
export declare function listEffects(): Array<{ name: string; about: string }>;
export declare function measureCell(
  ctx: CanvasRenderingContext2D,
  font: string,
): CellMetrics;
export declare function makeBuffers(
  w: number,
  h: number,
  prev?: FrameBuffers,
): FrameBuffers;
export declare function paintFrame(
  ctx: CanvasRenderingContext2D,
  session: Session,
  buf: FrameBuffers,
  metrics: CellMetrics,
  opts?: WebPlayOptions,
): void;

export interface WebAnimation {
  done: Promise<void>;
  cancel(): void;
}

/** Animate text on a <canvas>; same options vocabulary as Node `play`. */
export declare function playOnCanvas(
  canvas: HTMLCanvasElement,
  input: string,
  effect: EffectName | string,
  opts?: WebPlayOptions,
): WebAnimation;

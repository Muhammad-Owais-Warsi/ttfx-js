import type { FramesOptions } from './index';

export type { FramesOptions };

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
  noColor?: boolean;
}

export declare function listEffects(): EffectName[];
export declare function getFrames(input: string, effect: EffectName | string, options?: FramesOptions): string[];
export declare function stripAnsi(s: string): string;
export declare function play(input: string, effect: EffectName | string, opts?: PlayOptions): Promise<void>;

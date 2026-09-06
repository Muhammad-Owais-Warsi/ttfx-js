import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const { getFrames, listEffects, play, stripAnsi } = require('./api.js');

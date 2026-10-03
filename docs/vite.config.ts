import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  server: { port: 5178 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        cli: resolve(root, 'cli.html'),
        node: resolve(root, 'node.html'),
        web: resolve(root, 'web.html'),
        effects: resolve(root, 'effects.html'),
      },
    },
  },
});

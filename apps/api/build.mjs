import { build } from 'esbuild';

// One self-contained file: the runtime image needs no node_modules.
await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.cjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  // Optional native driver that `pg` only loads when asked to.
  external: ['pg-native'],
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
});

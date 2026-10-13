// Monaco is served from our own origin, not a CDN, so the Content Security
// Policy can stay strict. This copies its prebuilt files into public/.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve('monaco-editor/package.json'));
const source = join(packageDir, 'min', 'vs');
const target = fileURLToPath(new URL('../public/monaco/vs', import.meta.url));

if (existsSync(target)) rmSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.info(`Copied Monaco to ${target}`);

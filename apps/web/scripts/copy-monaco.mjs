// Monaco is served from our own origin, not a CDN, so the Content Security
// Policy can stay strict. This copies its prebuilt files into public/.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const manifestPath = require.resolve('monaco-editor/package.json');
const packageDir = dirname(manifestPath);
const { version } = require(manifestPath);
const source = join(packageDir, 'min', 'vs');
// The version is part of the path, so an upgrade can never be mixed with cached files of the old one.
const base = fileURLToPath(new URL('../public/monaco', import.meta.url));
const target = join(base, version, 'vs');

if (existsSync(base)) rmSync(base, { recursive: true });
cpSync(source, target, { recursive: true });
console.info(`Copied Monaco to ${target}`);

// Runs the API on the host with live reload:  npm run dev:api
// Start its dependencies first:  npm run dev:services
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { devEnv } from './dev-env.mjs';

const apiDir = fileURLToPath(new URL('../apps/api', import.meta.url));
// Node runs tsx's own entry point, so no shell is involved.
const tsx = fileURLToPath(import.meta.resolve('tsx/cli'));
const child = spawn(process.execPath, [tsx, 'watch', 'src/server.ts'], { cwd: apiDir, env: devEnv(), stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));

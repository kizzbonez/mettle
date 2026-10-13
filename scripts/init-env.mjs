// Creates .env from .env.example with fresh random secrets.
// Safe to re-run: an existing .env is left alone unless --force is passed.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = `${root}.env`;

if (existsSync(target) && !process.argv.includes('--force')) {
  console.log('.env already exists; leaving it alone (use --force to regenerate).');
  process.exit(0);
}

const secrets = {
  POSTGRES_PASSWORD: randomBytes(24).toString('hex'),
  JWT_SECRET: randomBytes(48).toString('base64url'),
  DATA_KEY: randomBytes(32).toString('base64'),
  RUNNER_TOKEN: randomBytes(32).toString('base64url'),
};

const filled = readFileSync(`${root}.env.example`, 'utf8')
  .split('\n')
  .map((line) => {
    const match = /^([A-Z_]+)=$/.exec(line.trim());
    return match && secrets[match[1]] ? `${match[1]}=${secrets[match[1]]}` : line;
  })
  .join('\n');

writeFileSync(target, filled, { mode: 0o600 });
console.log('Wrote .env with generated secrets.');

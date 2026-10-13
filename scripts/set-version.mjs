// Sets one version on the root package and every workspace:
//   node scripts/set-version.mjs 1.2.0
// Then update CHANGELOG.md, commit, and tag `v1.2.0`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  console.error('Usage: node scripts/set-version.mjs <major.minor.patch>');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const workspaces = ['apps', 'packages'].flatMap((dir) =>
  readdirSync(`${root}${dir}`).map((name) => `${root}${dir}/${name}/package.json`),
);

for (const path of [`${root}package.json`, ...workspaces]) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  manifest.version = version;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(`Set version ${version} on ${workspaces.length + 1} packages.`);

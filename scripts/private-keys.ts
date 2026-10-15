import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** A whole PEM private key: what secret scanners flag, even when it only ever signed a test. */
const PEM_PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/**
 * Curriculum files that hold a private key, relative to the content folder. A lab that needs a
 * key generates it in the test, or ships a raw test seed that a helper turns into a key.
 */
export function privateKeysIn(contentDir: string): string[] {
  return filesUnder(contentDir)
    .filter((path) => PEM_PRIVATE_KEY.test(readFileSync(path, 'utf8')))
    .map((path) => relative(contentDir, path).replaceAll('\\', '/'));
}

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';

/** Reads text with normalized line endings, so content is identical on every OS. */
export function readText(path: string): string {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

export function readYaml<S extends z.ZodType>(path: string, schema: S): z.infer<S> {
  const parsed = schema.safeParse(parseYaml(readText(path)));
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  throw new Error(`${path}: ${issue?.path.join('.') ?? ''} ${issue?.message ?? 'is invalid'}`);
}

export function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

export function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort();
}

/** `01-ownership.md` becomes `ownership`. */
export function slugFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/^\d+-/, '');
}

/** Splits `---\nyaml\n---\nbody` into its two halves. */
export function splitFrontMatter(path: string): { data: unknown; body: string } {
  const text = readText(path);
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${path}: missing front matter`);
  return { data: parseYaml(match[1] ?? ''), body: (match[2] ?? '').trim() };
}

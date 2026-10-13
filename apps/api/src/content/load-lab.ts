import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LabLanguage } from '@mettle/shared';
import { listFiles, readText, readYaml } from './files';
import { labFile, type ContentLab } from './types';

export const LAB_EXTENSION: Record<LabLanguage, string> = { rust: 'rs', python: 'py', bash: 'sh' };

export function loadLab(dir: string): ContentLab | null {
  if (!existsSync(join(dir, 'lab.yaml'))) return null;
  const meta = readYaml(join(dir, 'lab.yaml'), labFile);
  const ext = LAB_EXTENSION[meta.language];
  const dataDir = join(dir, 'data');
  return {
    ...meta,
    scenario: readText(join(dir, 'scenario.md')).trim(),
    instructions: readText(join(dir, 'instructions.md')).trim(),
    starter: readText(join(dir, `starter.${ext}`)),
    solution: readText(join(dir, `solution.${ext}`)),
    fixtures: listFiles(dataDir).map((name) => ({
      path: `data/${name}`,
      content: readText(join(dataDir, name)),
    })),
    tests: meta.tests.map((test) => ({
      name: test.name,
      hidden: test.hidden,
      code: readText(join(dir, 'tests', test.file)).trimEnd(),
    })),
  };
}

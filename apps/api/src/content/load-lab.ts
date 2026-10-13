import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LAB_SOLUTION_FILE } from '@mettle/shared';
import type { z } from 'zod';
import { listDirs, listFiles, readText, readYaml } from './files';
import { labFile, practiceFile, type ContentLab, type ContentPractice } from './types';

type LabMeta = z.infer<typeof practiceFile>;

/** Reads the files a lab is made of. `lab.yaml` has been parsed already. */
function readLabFiles(dir: string, meta: LabMeta): Omit<ContentLab, 'slug'> {
  // starter.rs sits beside solution.rs, starter.yaml beside solution.yaml, and so on.
  const ext = LAB_SOLUTION_FILE[meta.language].split('.').pop();
  const dataDir = join(dir, 'data');
  const scenarioPath = join(dir, 'scenario.md');
  return {
    ...meta,
    // A practice lab is small enough to need no scene-setting.
    scenario: existsSync(scenarioPath) ? readText(scenarioPath).trim() : '',
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

/** The level's own lab, in `<level>/lab/`. */
export function loadLab(dir: string): ContentLab | null {
  if (!existsSync(join(dir, 'lab.yaml'))) return null;
  const meta = readYaml(join(dir, 'lab.yaml'), labFile);
  return { ...readLabFiles(dir, meta), slug: meta.slug };
}

/**
 * The practice labs of a level, one folder per lesson: `<level>/practice/<lesson-slug>/`.
 * The folder name says which lesson the lab belongs to, and gives the lab its slug.
 */
export function loadPractice(levelDir: string): ContentPractice[] {
  const practiceDir = join(levelDir, 'practice');
  return listDirs(practiceDir)
    .filter((lesson) => existsSync(join(practiceDir, lesson, 'lab.yaml')))
    .map((lesson) => {
      const dir = join(practiceDir, lesson);
      return { ...readLabFiles(dir, readYaml(join(dir, 'lab.yaml'), practiceFile)), slug: `practice-${lesson}`, lesson };
    });
}

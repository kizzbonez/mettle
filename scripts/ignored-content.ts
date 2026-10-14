import { execFileSync } from 'node:child_process';

/**
 * Curriculum files git would leave out of a commit, relative to the content folder.
 * A fixture missing from a clone breaks its lab everywhere but on the author's machine.
 */
export function ignoredContent(contentDir: string): string[] {
  try {
    const listed = execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--', '.'], {
      cwd: contentDir,
      encoding: 'utf8',
    });
    return listed.split('\n').filter(Boolean);
  } catch {
    return []; // not a git checkout: there is nothing to compare against
  }
}

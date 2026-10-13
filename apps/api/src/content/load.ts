import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIFFICULTIES, type Difficulty } from '@mettle/shared';
import { z } from 'zod';
import { listDirs, listFiles, readYaml, slugFromFile, splitFrontMatter } from './files';
import { loadLab, loadPractice } from './load-lab';
import {
  courseFile,
  lessonFrontMatter,
  questionFile,
  trackFile,
  type ContentCourse,
  type ContentLesson,
  type ContentTrack,
} from './types';

function loadLesson(dir: string, name: string): ContentLesson {
  const path = join(dir, name);
  const { data, body } = splitFrontMatter(path);
  const meta = lessonFrontMatter.safeParse(data);
  if (!meta.success) throw new Error(`${path}: ${meta.error.issues[0]?.message ?? 'invalid front matter'}`);
  return { ...meta.data, slug: slugFromFile(name), body };
}

function loadCourse(dir: string, level: Difficulty): ContentCourse {
  const lessonDir = join(dir, 'lessons');
  const questionsPath = join(dir, 'questions.yaml');
  return {
    ...readYaml(join(dir, 'course.yaml'), courseFile),
    level,
    lessons: listFiles(lessonDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => loadLesson(lessonDir, name)),
    questions: existsSync(questionsPath) ? readYaml(questionsPath, z.array(questionFile)) : [],
    lab: loadLab(join(dir, 'lab')),
    practice: loadPractice(dir),
  };
}

function loadTrack(dir: string, slug: string): ContentTrack {
  const courses = DIFFICULTIES.filter((level) => existsSync(join(dir, level, 'course.yaml'))).map((level) =>
    loadCourse(join(dir, level), level),
  );
  return { ...readYaml(join(dir, 'track.yaml'), trackFile), slug, courses };
}

/** The slugs of the tracks under `<contentDir>/tracks`: every folder with a `track.yaml`. */
export function listTrackSlugs(contentDir: string): string[] {
  const tracksDir = join(contentDir, 'tracks');
  return listDirs(tracksDir).filter((slug) => existsSync(join(tracksDir, slug, 'track.yaml')));
}

export interface ShippedTrack {
  slug: string;
  revision: number;
}

/** Each shipped track and its revision, read from `track.yaml` alone. */
export function listShippedTracks(contentDir: string): ShippedTrack[] {
  return listTrackSlugs(contentDir).map((slug) => ({
    slug,
    revision: readYaml(join(contentDir, 'tracks', slug, 'track.yaml'), trackFile).revision,
  }));
}

/** Loads the tracks under `<contentDir>/tracks` (all of them, or just `only`), in display order. */
export function loadContent(contentDir: string, only?: string[]): ContentTrack[] {
  const tracksDir = join(contentDir, 'tracks');
  return listTrackSlugs(contentDir)
    .filter((slug) => !only || only.includes(slug))
    .map((slug) => loadTrack(join(tracksDir, slug), slug))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

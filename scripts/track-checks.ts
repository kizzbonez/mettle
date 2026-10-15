import type { ContentTrack } from '../apps/api/src/content/types';

/** Every exam rule can be filled from the bank, and no exam slug clashes with the ones the seeder makes. */
function examProblems(track: ContentTrack): string[] {
  const problems: string[] = [];
  const taken = new Set(['track-assessment', ...track.courses.map((course) => `${course.level}-mock-exam`)]);
  for (const exam of track.exams) {
    if (taken.has(exam.slug)) problems.push(`${track.slug}: exam slug "${exam.slug}" is already used`);
    taken.add(exam.slug);
    for (const rule of exam.rules) {
      const pool = track.courses
        .filter((course) => !rule.level || course.level === rule.level)
        .flatMap((course) => course.questions)
        .filter((question) => !rule.category || (question.category ?? track.category) === rule.category);
      if (pool.length < rule.count) {
        const filter = [rule.category, rule.level].filter(Boolean).join(', ') || 'any question';
        problems.push(`${track.slug}/${exam.slug}: a rule draws ${rule.count} (${filter}) but the bank has ${pool.length}`);
      }
    }
  }
  return problems;
}

/** Nothing named as retired is still shipped: retiring it would hide live content. */
function retiredProblems(track: ContentTrack): string[] {
  const lessons = new Set(track.courses.flatMap((course) => course.lessons.map((lesson) => `${course.level}/${lesson.slug}`)));
  const labs = new Set(
    track.courses.flatMap((course) => [course.lab?.slug, ...course.practice.map((lab) => lab.slug)].filter(Boolean).map((slug) => `${course.level}/${slug}`)),
  );
  const keys = new Set(track.courses.flatMap((course) => course.questions.map((question) => question.key)));
  const shipped = [
    ...track.retired.lessons.filter((ref) => lessons.has(ref)),
    ...track.retired.labs.filter((ref) => labs.has(ref)),
    ...track.retired.questions.filter((key) => keys.has(key)),
  ];
  return shipped.map((ref) => `${track.slug}: "${ref}" is listed as retired but is still shipped`);
}

/** Checks on track.yaml itself: its own exams and its retired items. */
export function trackProblems(track: ContentTrack): string[] {
  return [...examProblems(track), ...retiredProblems(track)];
}

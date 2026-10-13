import { LAB_LANGUAGES, LEVELS, levelInfo, PUBLISH_STATUSES, QUESTION_TYPES } from '@mettle/shared';
import type { AdminCourse, AdminTrack, Category } from '@/types/content-admin';
import { LANGUAGE_LABEL, STATUS_LABEL, TYPE_LABEL } from './labels';

/** `<option>` lists shared by the forms and the table filters. */

export function StatusOptions() {
  return <>{PUBLISH_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</>;
}

export function LevelOptions() {
  return <>{LEVELS.map((level) => <option key={level.key} value={level.key}>{level.mark} · {level.label}</option>)}</>;
}

export function TypeOptions() {
  return <>{QUESTION_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABEL[type]}</option>)}</>;
}

export function LanguageOptions() {
  return <>{LAB_LANGUAGES.map((language) => <option key={language} value={language}>{LANGUAGE_LABEL[language]}</option>)}</>;
}

export function TrackOptions({ tracks }: { tracks: AdminTrack[] }) {
  return <>{tracks.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}</>;
}

export function CategoryOptions({ categories }: { categories: Category[] }) {
  return <>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</>;
}

/** Courses grouped under their track, each named with its level. */
export function CourseOptions({ courses }: { courses: AdminCourse[] }) {
  const trackIds = [...new Set(courses.map((course) => course.trackId))];
  return (
    <>
      {trackIds.map((trackId) => {
        const inTrack = courses.filter((course) => course.trackId === trackId);
        return (
          <optgroup key={trackId} label={inTrack[0]?.trackTitle}>
            {inTrack.map((course) => <option key={course.id} value={course.id}>{levelInfo(course.level).mark} · {course.title}</option>)}
          </optgroup>
        );
      })}
    </>
  );
}

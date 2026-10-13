import type { Difficulty, LabLanguage } from '@mettle/shared';

export interface Progress {
  total: number;
  done: number;
  percent: number;
}

export interface CourseSummary {
  id: string;
  level: Difficulty;
  title: string;
  summary: string;
  outcomes: string[];
  lessonCount: number;
  labCount: number;
  examCount: number;
}

export interface TrackSummary<C = CourseSummary> {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  courses: C[];
}

export interface CatalogCourse extends CourseSummary {
  enrolled: boolean;
  completed: boolean;
  progress: Progress;
}

export interface NextItem {
  kind: 'lesson' | 'exam' | 'lab' | 'course';
  id: string;
  title: string;
  href: string;
}

export interface SyllabusLesson {
  id: string;
  title: string;
  summary: string;
  estMinutes: number;
  done: boolean;
  /** The lab attached to this lesson, if it has one. */
  practice: SyllabusLab | null;
}

export interface SyllabusExam {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passPercent: number;
  attempts: number;
  bestScore: number | null;
  done: boolean;
}

export interface SyllabusLab {
  id: string;
  title: string;
  summary: string;
  language: LabLanguage;
  estMinutes: number;
  attempts: number;
  done: boolean;
}

export interface CourseDetail {
  course: { id: string; level: Difficulty; title: string; summary: string; outcomes: string[] };
  track: { id: string; slug: string; title: string; icon: string };
  enrolled: boolean;
  completed: boolean;
  progress: Progress;
  next: NextItem | null;
  lessons: SyllabusLesson[];
  exams: SyllabusExam[];
  labs: SyllabusLab[];
  trackExams: { id: string; title: string; description: string; timeLimitMinutes: number }[];
}

export interface LessonDetail {
  lesson: { id: string; title: string; summary: string; objectives: string[]; bodyMd: string; estMinutes: number };
  course: { id: string; title: string; level: Difficulty };
  track: { id: string; title: string; slug: string };
  done: boolean;
  practice: { id: string; title: string; summary: string; estMinutes: number; done: boolean } | null;
  position: number;
  count: number;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export interface MyCourse {
  id: string;
  title: string;
  summary: string;
  level: Difficulty;
  track: { id: string; slug: string; title: string; icon: string };
  enrolledAt: string;
  completed: boolean;
  progress: Progress;
  next: NextItem | null;
}

export interface Recommendation extends NextItem {
  reason: string;
  course: { id: string; title: string; level: Difficulty };
  track: string;
}

export interface ActivityEvent {
  id: string;
  kind: 'enrolled' | 'lesson_completed' | 'exam_passed' | 'exam_failed' | 'lab_passed' | 'course_completed';
  title: string;
  href: string | null;
  meta: { score?: number };
  createdAt: string;
}

export interface LearnerStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsTaken: number;
  examsPassed: number;
  averageScore: number | null;
  labsPassed: number;
}

export interface Dashboard {
  stats: LearnerStats;
  inProgress: MyCourse[];
  recommended: Recommendation[];
  activity: ActivityEvent[];
}

export interface SkillTree {
  tracks: {
    id: string;
    slug: string;
    title: string;
    icon: string;
    levels: { courseId: string; level: Difficulty; title: string; percent: number; state: 'completed' | 'in_progress' | 'ready' | 'ahead' }[];
  }[];
}

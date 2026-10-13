import type { Difficulty, Role } from '@mettle/shared';
import type { ActivityEvent, LearnerStats } from './catalog';

export interface AdminMetrics {
  users: { total: number; activeLast7Days: number; newLast30Days: number; banned: number };
  submissions: {
    total: number;
    exams: { total: number; passed: number; passRate: number | null };
    labs: { total: number; passed: number; passRate: number | null; runs: number };
  };
  content: { tracks: number; courses: number; lessons: number; questions: number; labs: number };
  series: { day: string; signups: number; exams: number; labs: number }[];
  topCourses: { id: string; title: string; level: Difficulty; track: string; learners: number }[];
  recentSignups: { id: string; displayName: string; email: string; createdAt: string }[];
  sandbox: { ok: boolean; active?: number; waiting?: number };
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: 'active' | 'banned';
  banReason: string | null;
  totpEnabledAt: string | null;
  lastSeenAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  stats: LearnerStats;
  activity: ActivityEvent[];
}

export interface EmailLogRow {
  id: string;
  toEmail: string;
  template: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  createdAt: string;
}

export interface SiteSettings {
  name: string;
  registrationOpen: boolean;
}

import type { Role } from '@mettle/shared';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  totpEnabled: boolean;
  /** An administrator who has not yet enrolled; the admin panel is closed to them. */
  mustEnrollTotp: boolean;
}

export interface SiteInfo {
  name: string;
  registrationOpen: boolean;
  setupNeeded: boolean;
  stats: { tracks: number; lessons: number; questions: number; labs: number };
}

export interface TotpEnrollment {
  secret: string;
  uri: string;
  qrSvg: string;
}

export interface DeviceSession {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

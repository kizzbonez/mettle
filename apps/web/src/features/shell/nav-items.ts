import type { Role } from '@mettle/shared';
import {
  BookOpenText, ClipboardList, FlaskConical, GraduationCap, LayoutDashboard, LayoutGrid, Mail, Route, Settings,
  ShieldHalf, SquareStack, UserRound, Users, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that see this item. Omitted means everyone. */
  roles?: Role[];
  /** Match the path exactly instead of by prefix. */
  exact?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const STAFF: Role[] = ['instructor', 'admin'];
const ADMIN: Role[] = ['admin'];

export const NAV: NavGroup[] = [
  {
    title: 'Learn',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/courses', label: 'Courses', icon: GraduationCap },
      { href: '/profile', label: 'Profile', icon: UserRound },
    ],
  },
  {
    title: 'Manage',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutGrid, roles: ADMIN, exact: true },
      { href: '/admin/users', label: 'Users', icon: Users, roles: ADMIN },
      { href: '/admin/email', label: 'Email', icon: Mail, roles: ADMIN },
      { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ADMIN },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/content/tracks', label: 'Tracks & courses', icon: Route, roles: STAFF },
      { href: '/admin/content/lessons', label: 'Lessons', icon: BookOpenText, roles: STAFF },
      { href: '/admin/content/questions', label: 'Question bank', icon: SquareStack, roles: STAFF },
      { href: '/admin/content/exams', label: 'Exams', icon: ClipboardList, roles: STAFF },
      { href: '/admin/content/labs', label: 'Labs', icon: FlaskConical, roles: STAFF },
    ],
  },
];

export const SECURITY_ICON = ShieldHalf;

/** The groups and items a role may see; empty groups are dropped. */
export function navFor(role: Role): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

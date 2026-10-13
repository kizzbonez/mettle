import { describe, expect, it } from 'vitest';
import { isActive, navFor, type NavItem } from './nav-items';

const hrefs = (role: Parameters<typeof navFor>[0]) => navFor(role).flatMap((group) => group.items.map((item) => item.href));

describe('navFor', () => {
  it('shows a learner only the learning pages', () => {
    expect(hrefs('learner')).toEqual(['/dashboard', '/courses', '/profile']);
    expect(navFor('learner').map((group) => group.title)).toEqual(['Learn']);
  });

  it('adds content management for an instructor, but not people or settings', () => {
    const items = hrefs('instructor');
    expect(items).toContain('/admin/content/questions');
    expect(items).not.toContain('/admin/users');
    expect(items).not.toContain('/admin/settings');
    expect(navFor('instructor').map((group) => group.title)).toEqual(['Learn', 'Content']);
  });

  it('shows an administrator everything', () => {
    const items = hrefs('admin');
    for (const href of ['/admin', '/admin/users', '/admin/email', '/admin/settings', '/admin/content/labs']) expect(items).toContain(href);
  });
});

describe('isActive', () => {
  const overview = { href: '/admin', exact: true } as NavItem;
  const users = { href: '/admin/users' } as NavItem;

  it('matches a section and the pages under it', () => {
    expect(isActive(users, '/admin/users')).toBe(true);
    expect(isActive(users, '/admin/users/42')).toBe(true);
    expect(isActive(users, '/admin/users-archive')).toBe(false);
  });

  it('matches an exact item only on its own page', () => {
    expect(isActive(overview, '/admin')).toBe(true);
    expect(isActive(overview, '/admin/users')).toBe(false);
  });
});

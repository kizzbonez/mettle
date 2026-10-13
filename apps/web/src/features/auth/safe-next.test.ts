import { describe, expect, it } from 'vitest';
import { safeNext } from './safe-next';

describe('safeNext', () => {
  it('keeps a path on this site', () => {
    expect(safeNext('/courses/abc')).toBe('/courses/abc');
    expect(safeNext('/admin/users?page=2')).toBe('/admin/users?page=2');
  });

  it.each([
    'https://evil.example/login',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'dashboard',
    '',
    null,
    undefined,
  ])('falls back to the dashboard for %j', (value) => {
    expect(safeNext(value)).toBe('/dashboard');
  });

  it('does not send a signed-in user back to a sign-in page', () => {
    expect(safeNext('/login')).toBe('/dashboard');
    expect(safeNext('/register?x=1')).toBe('/dashboard');
    expect(safeNext('/setup')).toBe('/dashboard');
  });
});

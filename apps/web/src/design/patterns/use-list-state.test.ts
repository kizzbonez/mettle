import { describe, expect, it } from 'vitest';
import { applyPatch, readState, toQuery, type ListDefaults } from './use-list-state';

const defaults: ListDefaults = { sort: 'createdAt', filters: ['role', 'status'] };

describe('readState', () => {
  it('uses the defaults for an empty URL', () => {
    expect(readState(new URLSearchParams(''), defaults)).toEqual({
      page: 1, pageSize: 20, sort: 'createdAt', order: 'desc', q: '', filters: { role: '', status: '' },
    });
  });

  it('reads paging, sorting, search and known filters', () => {
    const state = readState(new URLSearchParams('page=3&pageSize=50&sort=email&order=asc&q=ada&role=admin&other=x'), defaults);
    expect(state).toMatchObject({ page: 3, pageSize: 50, sort: 'email', order: 'asc', q: 'ada', filters: { role: 'admin', status: '' } });
    expect(state.filters).not.toHaveProperty('other');
  });

  it('ignores nonsense numbers and caps the page size', () => {
    const state = readState(new URLSearchParams('page=-2&pageSize=9999'), defaults);
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(100);
  });
});

describe('applyPatch', () => {
  const base = readState(new URLSearchParams('page=4&role=admin'), defaults);

  it('keeps the page when only the page changes', () => {
    expect(applyPatch(base, { page: 5 }).page).toBe(5);
  });

  it('returns to the first page when the rows would change', () => {
    expect(applyPatch(base, { q: 'ada' }).page).toBe(1);
    expect(applyPatch(base, { sort: 'email' }).page).toBe(1);
    expect(applyPatch(base, { filters: { status: 'banned' } }).page).toBe(1);
  });

  it('merges filters instead of replacing them', () => {
    expect(applyPatch(base, { filters: { status: 'banned' } }).filters).toEqual({ role: 'admin', status: 'banned' });
  });
});

describe('toQuery', () => {
  it('omits empty search and filters', () => {
    const query = toQuery(readState(new URLSearchParams('role=admin'), defaults));
    expect(query).toBe('page=1&pageSize=20&sort=createdAt&order=desc&role=admin');
  });
});

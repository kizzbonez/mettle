import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD, registerLearner, TestClient, uniqueEmail } from '../../../test/client';
import { waitForEmail } from '../../../test/mailbox';
import { signInStaff } from '../../../test/staff';
import { buildApp } from '../../app';
import { pool } from '../../db/client';

let app: FastifyInstance;
let admin: TestClient;
let adminId = '';
let instructor: TestClient;

beforeAll(async () => {
  app = await buildApp();
  const staff = await signInStaff(app, 'admin');
  admin = staff.client;
  adminId = staff.userId;
  instructor = (await signInStaff(app, 'instructor')).client;
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('access control', () => {
  it('keeps visitors and learners out of every admin endpoint', async () => {
    const visitor = new TestClient(app);
    const { client: learner } = await registerLearner(app);
    for (const url of ['/admin/metrics', '/admin/users', '/admin/tracks', '/admin/questions', '/admin/labs', '/admin/settings']) {
      expect((await visitor.get(url)).status, `visitor ${url}`).toBe(401);
      expect((await learner.get(url)).status, `learner ${url}`).toBe(403);
    }
  });

  it('lets an instructor manage content but not people', async () => {
    expect((await instructor.get('/admin/tracks')).status).toBe(200);
    expect((await instructor.get('/admin/questions')).status).toBe(200);
    expect((await instructor.get('/admin/users')).status).toBe(403);
    expect((await instructor.get('/admin/metrics')).status).toBe(403);
  });

  it('blocks an administrator who has not set up two-factor', async () => {
    const email = uniqueEmail('new-admin');
    await admin.post('/admin/users', { displayName: 'New Admin', email, password: PASSWORD, role: 'admin' });
    const fresh = new TestClient(app);
    const signedIn = await fresh.post('/auth/login', { email, password: PASSWORD });
    expect(signedIn.body.user.mustEnrollTotp).toBe(true);
    const blocked = await fresh.get('/admin/users');
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('two_factor_required');
  });
});

describe('dashboard metrics', () => {
  it('reports users, submissions, pass rates and a 30-day series', async () => {
    const { body } = await admin.get('/admin/metrics');
    expect(body.users.total).toBeGreaterThan(1);
    expect(body.users.activeLast7Days).toBeGreaterThan(0);
    expect(body.submissions).toHaveProperty('exams.passRate');
    expect(body.submissions).toHaveProperty('labs.passRate');
    expect(body.series).toHaveLength(30);
    expect(body.series.at(-1).signups).toBeGreaterThan(0);
    expect(body.content.tracks).toBeGreaterThan(0);
    expect(body.sandbox.ok).toBe(true);
  });
});

describe('user management', () => {
  it('pages, sorts, filters and searches on the server', async () => {
    const marker = `zeta${Date.now()}`;
    for (const name of ['Alpha', 'Bravo', 'Charlie']) await registerLearner(app, `${marker}-${name.toLowerCase()}@example.test`);
    const page = await admin.get(`/admin/users?q=${marker}&pageSize=2&sort=email&order=asc`);
    expect(page.body).toMatchObject({ total: 3, page: 1, pageSize: 2, pageCount: 2 });
    expect(page.body.items.map((u: { email: string }) => u.email)).toEqual([`${marker}-alpha@example.test`, `${marker}-bravo@example.test`]);
    const second = await admin.get(`/admin/users?q=${marker}&pageSize=2&page=2&sort=email&order=asc`);
    expect(second.body.items).toHaveLength(1);
    const admins = await admin.get('/admin/users?role=admin&pageSize=100');
    expect(admins.body.items.every((u: { role: string }) => u.role === 'admin')).toBe(true);
    expect(JSON.stringify(page.body)).not.toMatch(/passwordHash|totpSecret/);
  });

  it('ignores a sort column that is not on the allow-list', async () => {
    expect((await admin.get('/admin/users?sort=password_hash;drop table users')).status).toBe(200);
  });

  it('suspends a user at once, tells them why, and can lift the suspension', async () => {
    const { client: target, email, userId } = await registerLearner(app);
    const banned = await admin.post(`/admin/users/${userId}/ban`, { reason: 'Sharing exam answers' });
    expect(banned.body.user.status).toBe('banned');
    expect((await target.get('/auth/me')).status).toBe(401);
    const login = await new TestClient(app).post('/auth/login', { email, password: PASSWORD });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('banned');
    expect((await waitForEmail(email, 'suspended')).text).toContain('Sharing exam answers');

    await admin.post(`/admin/users/${userId}/unban`);
    expect((await new TestClient(app).post('/auth/login', { email, password: PASSWORD })).status).toBe(200);
  });

  it('protects administrators from locking themselves out', async () => {
    expect((await admin.post(`/admin/users/${adminId}/ban`, {})).body.error.code).toBe('self_change');
    expect((await admin.patch(`/admin/users/${adminId}`, { role: 'learner' })).body.error.code).toBe('self_change');
  });

  it('changes a role and shows a user with their progress', async () => {
    const { userId } = await registerLearner(app);
    expect((await admin.patch(`/admin/users/${userId}`, { role: 'instructor' })).body.user.role).toBe('instructor');
    const detail = await admin.get(`/admin/users/${userId}`);
    expect(detail.body.stats).toHaveProperty('lessonsCompleted');
    expect(detail.body.activity).toEqual([]);
  });
});

describe('email and settings', () => {
  it('emails selected users and logs each message', async () => {
    const one = await registerLearner(app);
    const two = await registerLearner(app);
    const sent = await admin.post('/admin/email', {
      userIds: [one.userId, two.userId],
      subject: 'Maintenance on Friday',
      message: 'The labs will be offline from 18:00 to 19:00 UTC.\n\nYour progress is safe.',
    });
    expect(sent.body).toEqual({ sent: 2, failed: 0 });
    const mail = await waitForEmail(one.email, 'Maintenance on Friday');
    expect(mail.text).toContain('Your progress is safe.');
    const log = await admin.get('/admin/email-log?pageSize=5');
    expect(log.body.items[0]).toMatchObject({ template: 'admin_message', status: 'sent' });
  });

  it('does not let a message carry HTML into the email', async () => {
    const { userId, email } = await registerLearner(app);
    await admin.post('/admin/email', { userIds: [userId], subject: 'Hello there', message: 'Click <script>alert(1)</script> now please' });
    const mail = await waitForEmail(email, 'Hello there');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it('closes and reopens registration', async () => {
    await admin.put('/admin/settings', { name: 'Mettle', registrationOpen: false });
    const refused = await new TestClient(app).post('/auth/register', { displayName: 'Late', email: uniqueEmail(), password: PASSWORD, confirmPassword: PASSWORD });
    expect(refused.body.error.code).toBe('registration_closed');
    await admin.put('/admin/settings', { name: 'Mettle', registrationOpen: true });
    expect((await admin.get('/admin/settings')).body.site.registrationOpen).toBe(true);
  });
});

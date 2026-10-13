import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD, registerLearner, TestClient, uniqueEmail } from '../../../test/client';
import { countEmails, resetTokenFrom, waitForEmail } from '../../../test/mailbox';
import { buildApp } from '../../app';
import { pool } from '../../db/client';
import { totpAt } from '../../lib/totp';
import { announceSetupToken } from '../setup/routes';

const SETUP_TOKEN = 'test-setup-token-0123456789';
const ADMIN = { email: 'admin@example.test', password: 'admin-password-123' };

let app: FastifyInstance;
let adminSecret = '';
let recoveryCodes: string[] = [];

beforeAll(async () => {
  app = await buildApp();
  await announceSetupToken(app.log);
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('first-run setup', () => {
  it('reports that setup is needed and refuses a wrong token', async () => {
    const client = new TestClient(app);
    expect((await client.get('/setup/status')).body).toEqual({ needed: true });
    const wrong = await client.post('/setup/verify', { token: 'not-the-token' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('setup_token_invalid');
  });

  it('creates the administrator with two-factor already on', async () => {
    const client = new TestClient(app);
    const enrollment = await client.post('/setup/totp', { token: SETUP_TOKEN, email: ADMIN.email });
    expect(enrollment.body.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(enrollment.body.qrSvg).toContain('<svg');
    adminSecret = enrollment.body.secret;

    const body = {
      token: SETUP_TOKEN, displayName: 'Ada Admin', email: ADMIN.email, password: ADMIN.password,
      confirmPassword: ADMIN.password, totpSecret: adminSecret, siteName: 'Mettle', registrationOpen: true,
    };
    const badCode = await client.post('/setup/complete', { ...body, totpCode: '000000' });
    expect(badCode.status).toBe(400);

    const done = await client.post('/setup/complete', { ...body, totpCode: totpAt(adminSecret, Date.now()) });
    expect(done.status).toBe(201);
    expect(done.body.user).toMatchObject({ role: 'admin', totpEnabled: true, mustEnrollTotp: false });
    expect(done.body.recoveryCodes).toHaveLength(10);
    recoveryCodes = done.body.recoveryCodes;
    expect((await client.get('/auth/me')).body.user.email).toBe(ADMIN.email);
  });

  it('cannot be run a second time', async () => {
    const client = new TestClient(app);
    expect((await client.get('/setup/status')).body).toEqual({ needed: false });
    expect((await client.post('/setup/verify', { token: SETUP_TOKEN })).status).toBe(409);
  });
});

describe('registration', () => {
  it('rejects mismatched and weak passwords with a message per field', async () => {
    const client = new TestClient(app);
    const base = { displayName: 'New Person', email: uniqueEmail() };
    const mismatch = await client.post('/auth/register', { ...base, password: PASSWORD, confirmPassword: 'different-1234' });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.error.details.fields.confirmPassword).toMatch(/do not match/);
    const weak = await client.post('/auth/register', { ...base, password: 'short1', confirmPassword: 'short1' });
    expect(weak.body.error.details.fields.password).toMatch(/at least 10/);
  });

  it('creates the account, signs in, and sends a welcome email', async () => {
    const { client, email } = await registerLearner(app);
    const me = await client.get('/auth/me');
    expect(me.body.user).toMatchObject({ email, role: 'learner', totpEnabled: false });
    const mail = await waitForEmail(email, 'Welcome');
    expect(mail.html).toContain('Go to your dashboard');
  });

  it('refuses an email that is already registered, whatever its case', async () => {
    const { email } = await registerLearner(app);
    const again = await new TestClient(app).post('/auth/register', {
      displayName: 'Copy', email: email.toUpperCase(), password: PASSWORD, confirmPassword: PASSWORD,
    });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('email_taken');
  });
});

describe('request forgery protection', () => {
  it('refuses a state-changing request without the app header', async () => {
    const forged = await new TestClient(app, false).post('/auth/login', { email: ADMIN.email, password: ADMIN.password });
    expect(forged.status).toBe(403);
    expect(forged.body.error.code).toBe('csrf');
  });
});

describe('sign-in', () => {
  it('gives the same answer for a wrong password and an unknown account', async () => {
    const { email } = await registerLearner(app);
    const client = new TestClient(app);
    const wrong = await client.post('/auth/login', { email, password: 'not-my-password-1' });
    const unknown = await client.post('/auth/login', { email: uniqueEmail('ghost'), password: 'not-my-password-1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('sets HttpOnly cookies and scopes the refresh token to the auth endpoints', async () => {
    const { email } = await registerLearner(app);
    const response = await new TestClient(app).post('/auth/login', { email, password: PASSWORD });
    const cookie = (name: string) => response.setCookies.find((c) => c.startsWith(`${name}=`)) ?? '';
    expect(cookie('mt_at')).toMatch(/HttpOnly/);
    expect(cookie('mt_at')).toMatch(/SameSite=Lax/);
    expect(cookie('mt_rt')).toMatch(/HttpOnly/);
    expect(cookie('mt_rt')).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie('mt_rt')).toMatch(/SameSite=Strict/);
  });

  it('locks the account after repeated failures, even for the right password', async () => {
    const { email } = await registerLearner(app);
    const client = new TestClient(app);
    for (let i = 0; i < 5; i += 1) await client.post('/auth/login', { email, password: 'wrong-password-1' });
    const locked = await client.post('/auth/login', { email, password: PASSWORD });
    expect(locked.status).toBe(429);
    expect(locked.body.error.code).toBe('locked');
  });

  it('requires the second factor from an account that has one', async () => {
    const client = new TestClient(app);
    const noCode = await client.post('/auth/login', ADMIN);
    expect(noCode.body.error.code).toBe('totp_required');
    const badCode = await client.post('/auth/login', { ...ADMIN, code: '123456' });
    expect(badCode.body.error.code).toBe('totp_invalid');
    const good = await client.post('/auth/login', { ...ADMIN, code: totpAt(adminSecret, Date.now()) });
    expect(good.status).toBe(200);
  });

  it('accepts a recovery code exactly once', async () => {
    const code = recoveryCodes[0];
    expect((await new TestClient(app).post('/auth/login', { ...ADMIN, code })).status).toBe(200);
    expect((await new TestClient(app).post('/auth/login', { ...ADMIN, code })).body.error.code).toBe('totp_invalid');
  });
});

describe('sessions', () => {
  it('renews an expired access token from the refresh token', async () => {
    const { client } = await registerLearner(app);
    client.cookies.delete('mt_at');
    expect((await client.get('/auth/me')).status).toBe(401);
    expect((await client.post('/auth/refresh')).status).toBe(200);
    expect((await client.get('/auth/me')).status).toBe(200);
  });

  it('ends the session on sign-out, including its refresh token', async () => {
    const { client } = await registerLearner(app);
    const stolen = new TestClient(app);
    for (const [name, value] of client.cookies) stolen.cookies.set(name, value);
    await client.post('/auth/logout');
    expect((await stolen.get('/auth/me')).status).toBe(401);
    expect((await stolen.post('/auth/refresh')).status).toBe(401);
  });

  it('lets a user revoke another device, effective on its next request', async () => {
    const { client: laptop, email } = await registerLearner(app);
    const phone = new TestClient(app);
    await phone.post('/auth/login', { email, password: PASSWORD });
    const list = await laptop.get('/account/sessions');
    expect(list.body.sessions).toHaveLength(2);
    const other = list.body.sessions.find((s: { current: boolean }) => !s.current);
    expect((await laptop.delete(`/account/sessions/${other.id}`)).status).toBe(200);
    expect((await phone.get('/auth/me')).status).toBe(401);
    expect((await laptop.get('/auth/me')).status).toBe(200);
  });
});

describe('password reset', () => {
  it('answers the same way for an unknown address', async () => {
    const response = await new TestClient(app).post('/auth/forgot-password', { email: uniqueEmail('nobody') });
    expect(response).toMatchObject({ status: 200, body: { ok: true } });
  });

  it('emails a single-use link that sets a new password and signs every device out', async () => {
    const { client: oldDevice, email } = await registerLearner(app);
    const visitor = new TestClient(app);
    await visitor.post('/auth/forgot-password', { email });
    const token = resetTokenFrom(await waitForEmail(email, 'Reset your'));
    const next = 'a-brand-new-password-7';

    const mismatch = await visitor.post('/auth/reset-password', { token, password: next, confirmPassword: 'nope-nope-nope-1' });
    expect(mismatch.status).toBe(400);
    expect((await visitor.post('/auth/reset-password', { token, password: next, confirmPassword: next })).status).toBe(200);
    expect((await oldDevice.get('/auth/me')).status).toBe(401);
    expect((await visitor.post('/auth/login', { email, password: PASSWORD })).status).toBe(401);
    expect((await visitor.post('/auth/login', { email, password: next })).status).toBe(200);

    const reuse = await visitor.post('/auth/reset-password', { token, password: 'yet-another-pass-8', confirmPassword: 'yet-another-pass-8' });
    expect(reuse.body.error.code).toBe('reset_token_invalid');
    await waitForEmail(email, 'password was changed');
  });

  it('sends one reset email per account however many times it is asked', async () => {
    const { email } = await registerLearner(app);
    const visitor = new TestClient(app);
    for (let i = 0; i < 4; i += 1) expect((await visitor.post('/auth/forgot-password', { email })).status).toBe(200);
    await waitForEmail(email, 'Reset your');
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(await countEmails(email, 'Reset your')).toBe(1);
  });
});

describe('account security', () => {
  it('changes the password only with the current one, and signs other devices out', async () => {
    const { client, email } = await registerLearner(app);
    const other = new TestClient(app);
    await other.post('/auth/login', { email, password: PASSWORD });
    const next = 'changed-password-42';
    const wrong = await client.post('/account/password', { currentPassword: 'not-it-12345', password: next, confirmPassword: next });
    expect(wrong.status).toBe(400);
    expect((await client.post('/account/password', { currentPassword: PASSWORD, password: next, confirmPassword: next })).status).toBe(200);
    expect((await client.get('/auth/me')).status).toBe(200);
    expect((await other.get('/auth/me')).status).toBe(401);
  });

  it('enrolls a learner in two-factor, then requires it at sign-in', async () => {
    const { client, email } = await registerLearner(app);
    const { secret } = (await client.post('/account/2fa/setup')).body;
    expect((await client.post('/account/2fa/enable', { code: '000000' })).status).toBe(400);
    const enabled = await client.post('/account/2fa/enable', { code: totpAt(secret, Date.now()) });
    expect(enabled.body.recoveryCodes).toHaveLength(10);

    const signIn = new TestClient(app);
    expect((await signIn.post('/auth/login', { email, password: PASSWORD })).body.error.code).toBe('totp_required');
    expect((await signIn.post('/auth/login', { email, password: PASSWORD, code: totpAt(secret, Date.now()) })).status).toBe(200);

    const off = await client.post('/account/2fa/disable', { password: PASSWORD, code: totpAt(secret, Date.now()) });
    expect(off.status).toBe(200);
    expect((await new TestClient(app).post('/auth/login', { email, password: PASSWORD })).status).toBe(200);
  });

  it('does not let an administrator turn two-factor off', async () => {
    const client = new TestClient(app);
    await client.post('/auth/login', { ...ADMIN, code: totpAt(adminSecret, Date.now()) });
    const off = await client.post('/account/2fa/disable', { password: ADMIN.password, code: totpAt(adminSecret, Date.now()) });
    expect(off.status).toBe(403);
  });
});

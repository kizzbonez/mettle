// The administrator's half of the tour: sign in with a second factor, then
// the overview, the users table and the content screens.
import { BASE, check } from './lib.mjs';
import { totp } from './totp.mjs';

async function signIn(page, admin) {
  if (!admin) throw new Error('No administrator on record. Run the tour once on a fresh install (with SETUP_TOKEN) first.');
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(admin.email);
  await page.getByLabel('Password', { exact: true }).fill(admin.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByLabel('Authenticator code').waitFor();
  check(true, 'an administrator is asked for a second factor');
  await page.getByLabel('Authenticator code').fill(totp(admin.secret));
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/dashboard**');
}

async function overview(page, shot) {
  await page.goto(`${BASE}/admin`);
  await page.getByText('Graded work per day').waitFor();
  await page.getByText('Sandbox online').waitFor();
  check(true, 'the overview loads and reports the sandbox online');
  await page.locator('svg[role="img"]').first().hover({ position: { x: 300, y: 80 } });
  await shot('15-admin-overview', { full: true });
}

async function users(page, shot) {
  await page.goto(`${BASE}/admin/users`);
  await page.getByRole('table', { name: 'Users' }).waitFor();
  await page.getByPlaceholder('Search by name or email').fill('reyes');
  await page.waitForURL('**q=reyes**');
  await page.getByText('Maya Reyes').first().waitFor();
  check((await page.getByRole('table', { name: 'Users' }).locator('tbody tr').count()) >= 1, 'searching the users table filters on the server');
  await page.getByPlaceholder('Search by name or email').fill('');
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Sort by Last seen/ }).click();
  await page.waitForURL('**sort=lastSeenAt**');
  await page.getByRole('checkbox', { name: 'Select row' }).nth(1).check();
  await page.getByRole('checkbox', { name: 'Select row' }).nth(2).check();
  await page.getByText('2 selected').waitFor();
  check(true, 'rows can be sorted and selected for a bulk email');
  await shot('16-admin-users');
}

async function content(page, shot) {
  await page.goto(`${BASE}/admin/content/questions`);
  await page.getByRole('table').first().waitFor();
  check((await page.getByRole('table').first().locator('tbody tr').count()) > 5, 'the question bank lists the seeded questions');
  await shot('17-admin-questions');

  await page.goto(`${BASE}/admin/content/labs`);
  await page.getByText('Loading Dock Ledger').first().click();
  await page.getByRole('button', { name: /Verify in sandbox/ }).waitFor({ timeout: 30_000 });
  await page.getByRole('button', { name: /Verify in sandbox/ }).click();
  await page.getByText(/sound/i).first().waitFor({ timeout: 120_000 });
  check(true, 'verifying a lab runs its solution and starter in the sandbox');
  await page.getByRole('button', { name: /Verify in sandbox/ }).scrollIntoViewIfNeeded();
  await shot('18-admin-lab');
}

async function signOut(page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login**');
  await page.goto(`${BASE}/admin`);
  await page.waitForURL('**/login?next=%2Fadmin');
  check(true, 'after signing out, the admin panel sends you to sign in');
}

export async function adminTour(page, shot, admin) {
  await signIn(page, admin);
  await overview(page, shot);
  await users(page, shot);
  await content(page, shot);
  await signOut(page);
}

/** The people screens only, for checking a build that has no content screens yet. */
export async function adminTourWithoutContent(page, shot, admin) {
  await signIn(page, admin);
  await overview(page, shot);
  await users(page, shot);
  await signOut(page);
}

// A real browser walks the whole product: first-run setup, sign-up, a lesson,
// an exam, a lab run in the sandbox, the profile, then the admin panel. Every
// step is checked, so this is the end-to-end test; with --shots it also takes
// the screenshots used by the user guide and the README.
//
//   node e2e/tour.mjs            check everything
//   node e2e/tour.mjs --shots    ...and write apps/web/public/guide-shots/*.png
//
// Needs the stack running (BASE_URL, default http://127.0.0.1:4310) and the
// development mailbox. On a fresh install, pass SETUP_TOKEN.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { adminTour, adminTourWithoutContent } from './tour-admin.mjs';
import { answerKey, BASE, check, levelShape, loadState, plain, root, saveState, shooter, waitForEmail } from './lib.mjs';
import { totp } from './totp.mjs';

const shots = process.argv.includes('--shots');
// The tour takes the first level of the Rust track, whatever size it currently is.
const LEVEL = levelShape('rust', 'basic');
const ADMIN = { name: 'Ada Okafor', email: 'ada@mettle.test', password: 'forge-and-anvil-42' };
// A clean install (the screenshot run) gets a tidy address; a reused one needs a unique address.
const LEARNER = { name: 'Maya Reyes', email: shots ? 'maya.reyes@mettle.test' : `maya.reyes+${Date.now()}@mettle.test`, password: 'quench-and-temper-7' };

async function setup(page, shot) {
  await page.goto(`${BASE}/`);
  if (!page.url().includes('/setup')) return console.log('  (already set up)');
  const token = process.env.SETUP_TOKEN;
  if (!token) throw new Error('This is a fresh install: pass SETUP_TOKEN (see `docker compose logs api`).');
  await page.getByLabel('Setup token').fill(token);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill(ADMIN.name);
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
  await page.getByLabel('Confirm password').fill(ADMIN.password);
  await shot('19-setup', { settle: 3200 });
  await page.getByRole('button', { name: 'Continue' }).click();
  const secret = await page.getByTestId('totp-secret').getAttribute('data-secret');
  await page.getByLabel(/6-digit code/).fill(totp(secret));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Finish setup' }).click();
  await page.getByTestId('recovery-codes').waitFor();
  check((await page.getByTestId('recovery-codes').locator('li').count()) === 10, 'setup issues ten recovery codes');
  saveState({ admin: { ...ADMIN, secret } });
  await page.context().clearCookies();
}

async function signUp(page, shot) {
  await page.goto(`${BASE}/`);
  await page.getByRole('heading', { name: /Prove your mettle/i }).waitFor();
  await shot('01-landing', { settle: 3200 });
  await page.goto(`${BASE}/register`);
  await page.getByLabel('Your name').fill(LEARNER.name);
  await page.getByLabel('Email').fill(LEARNER.email);
  await page.getByLabel('Password', { exact: true }).fill(LEARNER.password);
  await page.getByLabel('Confirm password').fill(LEARNER.password);
  await page.getByText('The passwords match.').waitFor();
  await shot('02-register', { settle: 3200 });
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard**');
  check((await waitForEmail(LEARNER.email, 'Welcome')).Text.includes('dashboard'), 'the welcome email is delivered');

  // An access token lasts fifteen minutes. Losing it must not sign anyone out.
  await page.context().clearCookies({ name: 'mt_at' });
  await page.reload();
  await page.getByText('Up next').waitFor();
  check(!page.url().includes('/login'), 'an expired access token is renewed without signing the learner out');
}

async function lessons(page, shot) {
  await page.goto(`${BASE}/courses`);
  await page.getByRole('link', { name: /Rust Foundations/ }).first().click();
  await page.getByText('Syllabus').waitFor();
  await page.getByRole('link', { name: /Lesson 01/ }).click();
  for (let lesson = 1; lesson <= LEVEL.lessons; lesson += 1) {
    await page.getByText(`Lesson ${lesson} of ${LEVEL.lessons}`).waitFor();
    if (lesson === 1) await shot('06-lesson');
    const here = page.url();
    await page.getByRole('button', { name: /Mark as read/ }).click();
    // The next lesson, or after the last one the level page.
    await page.waitForURL((url) => url.toString() !== here);
  }
  await page.waitForURL('**/courses/**');
  // A level is its lessons plus one exam and one lab.
  const progress = `${LEVEL.lessons} of ${LEVEL.lessons + 2} done`;
  await page.getByText(progress).waitFor();
  check(true, `every lesson read: the level shows ${progress}`);
  await shot('05-course');
}

async function exam(page, shot) {
  await page.getByRole('link', { name: /Mock exam/ }).click();
  await page.getByRole('button', { name: 'Start the exam' }).waitFor();
  await shot('07-exam-overview');
  await page.getByRole('button', { name: 'Start the exam' }).click();
  await page.getByRole('timer').waitFor();
  const correctFor = answerKey('rust', 'basic');
  for (let question = 0; question < LEVEL.questions; question += 1) {
    const options = page.getByRole('radiogroup').or(page.getByRole('group')).locator('button');
    const texts = await options.evaluateAll((nodes) => nodes.map((node) => node.querySelector('.prose-mettle')?.textContent ?? ''));
    const correct = correctFor(texts);
    for (const [index, text] of texts.entries()) {
      // Answer the fourth question wrongly on purpose, so the review shows both outcomes.
      const choose = question === 3 ? !correct.has(plain(text)) && index === texts.findIndex((t) => !correct.has(plain(t))) : correct.has(plain(text));
      if (choose) await options.nth(index).click();
    }
    if (question === 1) await page.getByRole('button', { name: /Flag for review/ }).click();
    if (question === 2) await shot('08-exam-runner');
    if (question < LEVEL.questions - 1) await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByRole('button', { name: 'Submit exam' }).click();
  await page.getByRole('button', { name: 'Submit for grading' }).click();
  await page.getByText('Exam result').waitFor();
  const score = `${LEVEL.questions - 1} of ${LEVEL.questions} correct`;
  check(await page.getByText(score).isVisible(), `the exam is graded ${score} and passed`);
  check((await page.getByText('Why', { exact: true }).count()) === LEVEL.questions, 'every question shows an explanation after grading');
  await shot('09-exam-result');
}

async function lab(page, shot) {
  await page.getByRole('link', { name: 'Back to the level' }).click();
  await page.getByRole('link', { name: /Lab ·/ }).click();
  await page.locator('.monaco-editor').first().waitFor({ timeout: 45_000 });
  await shot('10-lab-workspace', { settle: 2000 });
  await page.getByRole('button', { name: 'Run' }).click();
  await page.getByText(/0 \/ 1 passed/).waitFor({ timeout: 90_000 });
  check(true, 'running the starter code fails the sample test');
  await shot('11-lab-run');
  const solution = readFileSync(`${root}content/tracks/rust/basic/lab/solution.rs`, 'utf8');
  await page.evaluate((code) => window.monaco.editor.getModels()[0].setValue(code), solution);
  await page.getByRole('tab', { name: /Tests/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByText('Every test passed').waitFor({ timeout: 120_000 });
  check(await page.getByText(/3 \/ 3 passed/).isVisible(), 'the reference solution passes all three tests in the sandbox');
  await shot('12-lab-passed');
}

async function profile(page, shot) {
  await page.goto(`${BASE}/dashboard`);
  await page.getByText('Recent activity').waitFor();
  check(await page.getByText('Earned the mark for').first().isVisible(), 'finishing the level earns its mark');
  await shot('03-dashboard');
  await page.goto(`${BASE}/courses`);
  await page.getByRole('heading', { name: 'AI Development' }).waitFor();
  await shot('04-courses');
  await page.goto(`${BASE}/profile`);
  await page.getByText('1 of 4 marks').waitFor();
  await shot('13-skill-tree');
  await page.goto(`${BASE}/profile?tab=security`);
  await page.getByText('Signed-in devices').waitFor();
  await page.getByText('This device').waitFor();
  await shot('14-security');
}

async function passwordReset(page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login**');
  await page.goto(`${BASE}/forgot-password`);
  await page.getByLabel('Email').fill(LEARNER.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByText('Check your inbox').waitFor();
  const mail = await waitForEmail(LEARNER.email, 'Reset your');
  const link = /https?:\/\/\S+reset-password\?token=[\w%-]+/.exec(mail.Text)?.[0];
  check(Boolean(link), 'the reset email carries a link');
  await page.goto(`${BASE}${new URL(link).pathname}${new URL(link).search}`);
  await page.getByLabel('New password', { exact: true }).fill('a-brand-new-password-9');
  await page.getByLabel('Confirm new password').fill('a-brand-new-password-9');
  await page.getByRole('button', { name: 'Change password' }).click();
  await page.waitForURL('**/login?reset=1');
  await page.getByLabel('Email').fill(LEARNER.email);
  await page.getByLabel('Password', { exact: true }).fill('a-brand-new-password-9');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**');
  check(true, 'the new password signs in');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login**');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
page.on('console', (message) => {
  // A 401 followed by a silent token refresh is the designed behavior, not a fault.
  if (message.type() === 'error' && !message.text().includes('401')) problems.push(`console: ${message.text().slice(0, 200)}`);
});
const shot = shooter(page, shots);
const steps = [['Setup', setup], ['Sign up', signUp], ['Lessons', lessons], ['Exam', exam], ['Lab', lab], ['Profile', profile], ['Password reset', passwordReset]];

try {
  for (const [name, step] of steps) {
    console.log(`\n${name}`);
    await step(page, shot);
  }
  console.log('\nAdmin');
  await (process.env.TOUR_SKIP_CONTENT ? adminTourWithoutContent : adminTour)(page, shot, loadState().admin);
  check(problems.length === 0, `no browser errors during the tour${problems.length ? `: ${problems.join(' | ')}` : ''}`);
  console.log('\nTour complete.');
} catch (error) {
  await page.screenshot({ path: `${root}e2e/failure.png` }).catch(() => undefined);
  console.error(`\n${error.message}\nA screenshot of the failure is in e2e/failure.png (${page.url()}).`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

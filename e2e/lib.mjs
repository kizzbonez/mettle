// Shared helpers for the browser tour (e2e/tour.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4310';
export const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:4325';
export const SHOTS_DIR = `${root}apps/web/public/guide-shots`;
// Where the tour remembers the administrator it created. One file per install under test.
const STATE_FILE = process.env.TOUR_STATE ?? `${root}e2e/.state.json`;

export function loadState() {
  return existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
}

export function saveState(patch) {
  writeFileSync(STATE_FILE, JSON.stringify({ ...loadState(), ...patch }, null, 2));
}

export function check(condition, message) {
  if (!condition) throw new Error(`Check failed: ${message}`);
  console.log(`  ok  ${message}`);
}

/** Takes screenshots only when the tour was started with --shots. */
export function shooter(page, enabled) {
  if (enabled) mkdirSync(SHOTS_DIR, { recursive: true });
  return async (name, options = {}) => {
    if (!enabled) return;
    // Let entrance animations finish, so no screenshot catches one mid-flight.
    await page.waitForTimeout(options.settle ?? 1200);
    // A whole page is taken by growing the window to fit it, so a full-height sidebar stays full height.
    const view = page.viewportSize();
    if (options.full) await page.setViewportSize({ width: view.width, height: await page.evaluate(() => document.documentElement.scrollHeight) });
    await page.screenshot({ path: `${SHOTS_DIR}/${name}.png` });
    if (options.full) await page.setViewportSize(view);
    console.log(`  shot ${name}.png`);
  };
}

/** Waits for an email to arrive in the development mailbox. */
export async function waitForEmail(address, subjectIncludes, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
    const found = (await response.json()).messages.find((message) => message.Subject.includes(subjectIncludes));
    if (found) return (await fetch(`${MAILPIT}/api/v1/message/${found.ID}`)).json();
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`No "${subjectIncludes}" email reached ${address}`);
}

/** Markdown and whitespace removed, so rendered text can be compared with its source. */
const plain = (text) => text.replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Looks up the correct options for a question shown on screen, by matching its
 * option texts against the curriculum files. Only the tour needs this: it has
 * to pass an exam to show what passing looks like.
 */
export function answerKey(trackSlug, level) {
  const questions = parse(readFileSync(`${root}content/tracks/${trackSlug}/${level}/questions.yaml`, 'utf8'));
  return (shownOptions) => {
    const shown = shownOptions.map(plain).sort().join('|');
    const match = questions.find((question) => question.options.map((option) => plain(option.text)).sort().join('|') === shown);
    if (!match) throw new Error(`No question in ${trackSlug}/${level} has these options: ${shown.slice(0, 120)}`);
    return new Set(match.options.filter((option) => option.correct).map((option) => plain(option.text)));
  };
}

export { plain };

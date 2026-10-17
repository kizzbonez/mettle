// metronome.mjs: the beat engine of a music school's old practice page.
// Plain JavaScript with JSDoc comments and no TypeScript types. Read it to write your
// declarations in solution.ts. Do not change it.

/** The engine's version, a string such as "2.3.0". */
export const VERSION = "2.3.0";

const PATTERNS = {
  march: { name: "march", beats: 2, accents: [true, false] },
  waltz: { name: "waltz", beats: 3, accents: [true, false, false] },
  "four-four": { name: "four-four", beats: 4, accents: [true, false, false, false] },
  "six-eight": { name: "six-eight", beats: 6, accents: [true, false, false, true, false, false] },
};

/**
 * Milliseconds between two beats at a tempo.
 * @param {number} bpm beats per minute, from 20 to 300
 * @returns {number}
 * @throws {RangeError} when bpm is not a number from 20 to 300
 */
export function beatInterval(bpm) {
  if (typeof bpm !== "number" || !(bpm >= 20 && bpm <= 300)) {
    throw new RangeError(`tempo out of range: ${bpm}`);
  }
  return 60000 / bpm;
}

/**
 * @typedef {object} Pattern
 * @property {string} name
 * @property {number} beats how many beats one bar has
 * @property {boolean[]} accents one entry per beat, true where the beat is accented
 */

/**
 * Looks up a built-in pattern by its name.
 * @param {string} name
 * @returns {Pattern | undefined} a copy of the pattern, or undefined when there is no such pattern
 */
export function patternFor(name) {
  if (!Object.hasOwn(PATTERNS, name)) {
    return undefined;
  }
  const pattern = PATTERNS[name];
  return { name: pattern.name, beats: pattern.beats, accents: [...pattern.accents] };
}

/**
 * Draws one bar of a pattern as text, one symbol per beat, separated by spaces.
 * @param {Pattern} pattern
 * @param {{ accent?: string, beat?: string }} [symbols] what to draw for an accented beat
 *   (default "X") and for any other beat (default "x")
 * @returns {string}
 */
export function render(pattern, symbols = {}) {
  const accent = symbols.accent ?? "X";
  const beat = symbols.beat ?? "x";
  return pattern.accents.map((accented) => (accented ? accent : beat)).join(" ");
}

import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, isValidSelection, scoreAttempt, shuffle } from './grade';

describe('isAnswerCorrect', () => {
  it('accepts exactly the correct set, in any order', () => {
    expect(isAnswerCorrect(['a'], ['a'])).toBe(true);
    expect(isAnswerCorrect(['a', 'c'], ['c', 'a'])).toBe(true);
  });

  it('gives no partial credit', () => {
    expect(isAnswerCorrect(['a', 'c'], ['a'])).toBe(false);
    expect(isAnswerCorrect(['a'], ['a', 'b'])).toBe(false);
  });

  it('rejects a blank answer and a wrong one', () => {
    expect(isAnswerCorrect(['a'], [])).toBe(false);
    expect(isAnswerCorrect(['a'], ['b'])).toBe(false);
  });

  it('never marks a question with no correct option as correct', () => {
    expect(isAnswerCorrect([], [])).toBe(false);
  });
});

describe('scoreAttempt', () => {
  it('computes the percentage to two decimals', () => {
    expect(scoreAttempt([true, false, true], 60)).toEqual({ correct: 2, total: 3, percent: 66.67, passed: true });
  });

  it('passes exactly at the pass mark', () => {
    expect(scoreAttempt([true, true, true, true, true, true, true, false, false, false], 70).passed).toBe(true);
    expect(scoreAttempt([true, true, true, false, false], 70).passed).toBe(false);
  });

  it('fails an empty paper', () => {
    expect(scoreAttempt([], 0)).toEqual({ correct: 0, total: 0, percent: 0, passed: false });
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input);
    expect([...output].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('is deterministic for a given random source', () => {
    const sequence = [0.1, 0.9, 0.5, 0.3, 0.7];
    const source = () => {
      let i = 0;
      return () => sequence[i++ % sequence.length] as number;
    };
    expect(shuffle(['a', 'b', 'c', 'd'], source())).toEqual(shuffle(['a', 'b', 'c', 'd'], source()));
  });
});

describe('isValidSelection', () => {
  const options = ['a', 'b', 'c', 'd'];

  it('allows one choice for single and true/false questions', () => {
    expect(isValidSelection('single', options, ['b'])).toBe(true);
    expect(isValidSelection('single', options, ['a', 'b'])).toBe(false);
    expect(isValidSelection('true_false', ['t', 'f'], ['t', 'f'])).toBe(false);
  });

  it('allows several choices for multiple-answer questions', () => {
    expect(isValidSelection('multiple', options, ['a', 'd'])).toBe(true);
  });

  it('allows clearing an answer', () => {
    expect(isValidSelection('single', options, [])).toBe(true);
  });

  it('rejects options from another question and duplicates', () => {
    expect(isValidSelection('multiple', options, ['a', 'z'])).toBe(false);
    expect(isValidSelection('multiple', options, ['a', 'a'])).toBe(false);
  });
});

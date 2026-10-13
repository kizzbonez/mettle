import { describe, expect, it } from 'vitest';
import { passwordIsAcceptable, passwordRules, passwordStrength } from './password-rules';

describe('passwordRules', () => {
  it('reports each rule separately', () => {
    expect(passwordRules('short1').map((rule) => rule.met)).toEqual([false, true, true]);
    expect(passwordRules('longenoughbutnodigit').map((rule) => rule.met)).toEqual([true, true, false]);
    expect(passwordRules('1234567890').map((rule) => rule.met)).toEqual([true, false, true]);
  });
});

describe('passwordIsAcceptable', () => {
  it('matches what the API accepts', () => {
    expect(passwordIsAcceptable('correct-horse-9')).toBe(true);
    expect(passwordIsAcceptable('short1')).toBe(false);
    expect(passwordIsAcceptable('nodigitshereatall')).toBe(false);
  });

  it('refuses more than 72 bytes, which bcrypt would silently cut off', () => {
    expect(passwordIsAcceptable(`a1${'x'.repeat(70)}`)).toBe(true);
    expect(passwordIsAcceptable(`a1${'x'.repeat(71)}`)).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('is zero for nothing and one until the rules are met', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('abcdefghijk')).toBe(1);
  });

  it('rises with length and variety', () => {
    expect(passwordStrength('abcdefghi1')).toBe(2);
    expect(passwordStrength('abcdefghijk1')).toBe(3);
    expect(passwordStrength('Abcdefghijkl1!')).toBe(4);
    expect(passwordStrength('abcdefghijklmno1')).toBe(4);
  });
});

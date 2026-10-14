import { describe, expect, it } from 'vitest';
import { frameAncestors, frameAncestorsDirective } from './framing';

describe('frameAncestors', () => {
  it('allows no one when nothing is set', () => {
    expect(frameAncestors(undefined)).toEqual([]);
    expect(frameAncestorsDirective(frameAncestors(''))).toBe("frame-ancestors 'none'");
  });

  it('reads origins separated by spaces or commas', () => {
    const origins = frameAncestors('https://portfolio.solamariweb.com, http://localhost:3000');
    expect(origins).toEqual(['https://portfolio.solamariweb.com', 'http://localhost:3000']);
    expect(frameAncestorsDirective(origins)).toBe("frame-ancestors 'self' https://portfolio.solamariweb.com http://localhost:3000");
  });

  it('ignores anything that is not a plain origin', () => {
    const tricks = "https://ok.example.com https://evil.example.com/path * 'unsafe-inline' https://x.example.com;script-src";
    expect(frameAncestors(tricks)).toEqual(['https://ok.example.com']);
  });
});

import { describe, expect, it } from 'vitest';
import { planSync } from './sync';

const shipped = (...tracks: [string, number][]) => tracks.map(([slug, revision]) => ({ slug, revision }));

describe('planSync', () => {
  it('adds everything to an empty database', () => {
    expect(planSync(shipped(['ai', 1], ['rust', 2]), [], {})).toEqual({ add: ['ai', 'rust'], update: [] });
  });

  it('adds only the subjects an upgrade brings', () => {
    const plan = planSync(shipped(['ai', 1], ['cpp', 1], ['rust', 1]), ['ai', 'rust'], { ai: 1, rust: 1 });
    expect(plan).toEqual({ add: ['cpp'], update: [] });
  });

  it('updates a track whose shipped revision is newer than the one on record', () => {
    const plan = planSync(shipped(['ai', 1], ['rust', 2]), ['ai', 'rust'], { ai: 1, rust: 1 });
    expect(plan).toEqual({ add: [], update: ['rust'] });
  });

  it('treats a track installed before records were kept as revision 1', () => {
    expect(planSync(shipped(['ai', 1], ['rust', 2]), ['ai', 'rust'], {})).toEqual({ add: [], update: ['rust'] });
  });

  it('does nothing once a revision has been applied', () => {
    expect(planSync(shipped(['rust', 2]), ['rust'], { rust: 2 })).toEqual({ add: [], update: [] });
  });

  it('does not bring back a shipped track that was deleted, even when it is revised', () => {
    expect(planSync(shipped(['ai', 3], ['rust', 1]), ['rust'], { ai: 1, rust: 1 })).toEqual({ add: [], update: [] });
  });

  it('leaves alone a track someone created with the slug of a new subject', () => {
    expect(planSync(shipped(['python', 1]), ['python'], {})).toEqual({ add: [], update: [] });
  });
});

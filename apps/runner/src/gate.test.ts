import { describe, expect, it } from 'vitest';
import { BusyError, Gate } from './gate';

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

describe('Gate', () => {
  it('never runs more tasks at once than its limit', async () => {
    const gate = new Gate(2, 10);
    let running = 0;
    let peak = 0;
    const task = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
    };
    await Promise.all(Array.from({ length: 9 }, () => gate.run(task)));
    expect(peak).toBe(2);
    expect(gate.stats).toEqual({ active: 0, waiting: 0 });
  });

  it('refuses work once the queue is full', async () => {
    const gate = new Gate(1, 1);
    const hold = deferred();
    const first = gate.run(() => hold.promise);
    const second = gate.run(async () => 'queued');
    await expect(gate.run(async () => 'rejected')).rejects.toBeInstanceOf(BusyError);
    hold.release();
    await first;
    await expect(second).resolves.toBe('queued');
  });

  it('frees the slot when a task throws', async () => {
    const gate = new Gate(1, 1);
    await expect(gate.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(gate.run(async () => 'next')).resolves.toBe('next');
  });
});

// Barrier: methods with a `this` parameter, working on whichever barrier they are called on.
import { createBarrier, type Barrier } from "./solution.js";

const north = createBarrier();
const south = createBarrier();
check.equal({ open: north.open, raises: north.raises }, { open: false, raises: 0 }, "a new barrier is closed and never raised");

check.equal(north.raise(), 1, "the first raise returns 1");
check.equal(north.raise(), 2, "the second raise returns 2");
check.equal(north.raises, 2, "raises counts every raise");
check.equal(south.raises, 0, "each barrier keeps its own count");
north.lower();
check.true(!north.open, "lower closes the barrier");
north.lower();
check.true(!north.open, "lowering a closed barrier keeps it closed");

const bound = south.raise.bind(south);
check.equal(bound(), 1, "a bound raise works on its own barrier");
check.true(south.open, "the bound raise opened its barrier");

const spare: Barrier = { ...north, open: false, raises: 10 };
check.equal(spare.raise(), 11, "raise works through `this`, so a copied method changes the copy");
check.equal(north.raises, 2, "raising the copy leaves the original alone");
check.equal(north.raise.call(spare), 12, "raise called with another barrier changes that barrier");
check.true(spare.open, "raise opened the barrier it was called on");
spare.lower.call(spare);
check.true(!spare.open, "lower closes the barrier it is called on");

export function misuse(barrier: Barrier): void {
  const raise = barrier.raise;
  const lower = barrier.lower;
  // @ts-expect-error raise needs a barrier as `this`
  raise();
  // @ts-expect-error lower needs a barrier as `this`
  lower();
  // @ts-expect-error `this` must be a whole barrier
  barrier.raise.call({ open: true });
}

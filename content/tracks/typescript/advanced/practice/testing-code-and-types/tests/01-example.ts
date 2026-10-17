// Your checks must pass on the correct functions and catch a fare without the night surcharge
// and a bookRide that never asks twice.
import { bookingChecks, bookRide, fare, fareChecks, type Checks } from "./solution.js";

/** Runs every check against FN and returns the names of the checks that failed. */
async function failing<F>(checks: Checks<F>, fn: F): Promise<string[]> {
  const failed: string[] = [];
  for (const [name, body] of Object.entries(checks)) {
    try {
      await body(fn);
    } catch {
      failed.push(name);
    }
  }
  return failed;
}

check.equal(await failing(fareChecks, fare), [], "every fare check passes on the correct fare");
check.equal(await failing(bookingChecks, bookRide), [], "every booking check passes on the correct bookRide");

function withoutNightSurcharge(km: number, _night: boolean): number {
  if (!Number.isFinite(km) || km < 0) throw new RangeError("negative distance");
  return 300 + 150 * Math.ceil(km);
}
check.true(
  (await failing(fareChecks, withoutNightSurcharge)).length > 0,
  "fareChecks should fail on a fare without the night surcharge, but all of them passed",
);

async function asksOnlyOnce(dispatch: (area: string) => Promise<string>, area: string, attempts: number): Promise<string> {
  if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError("too few attempts");
  try {
    return await dispatch(area);
  } catch (error) {
    throw new Error(`no driver after ${attempts} attempts`, { cause: error });
  }
}
check.true(
  (await failing(bookingChecks, asksOnlyOnce)).length > 0,
  "bookingChecks should fail on a bookRide that never asks twice, but all of them passed",
);

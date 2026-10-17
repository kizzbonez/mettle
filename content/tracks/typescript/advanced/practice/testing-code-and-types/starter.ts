// Taxi Booking Tests
//
// fare and bookRide work: do not change them. Write checks for them below, and fix Equal.
import assert from "node:assert/strict";
import { mock } from "node:test";

/**
 * The price in cents of a ride of KM kilometres: 300, plus 150 for every started kilometre.
 * At night the price is 25% higher, rounded up to a whole cent.
 * Throws a RangeError when KM is negative or not a finite number.
 */
export function fare(km: number, night: boolean): number {
  if (!Number.isFinite(km) || km < 0) throw new RangeError(`distance must be 0 km or more, got ${km}`);
  const day = 300 + 150 * Math.ceil(km);
  return night ? Math.ceil(day * 1.25) : day;
}

/**
 * Asks DISPATCH for a driver in AREA, up to ATTEMPTS times, and returns the first driver found.
 * When every attempt fails, rejects with Error("no driver after N attempts") whose cause is the
 * last failure. Rejects with a RangeError, without asking, when ATTEMPTS is not a whole number
 * of at least 1.
 */
export async function bookRide(dispatch: (area: string) => Promise<string>, area: string, attempts: number): Promise<string> {
  if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError(`attempts must be 1 or more, got ${attempts}`);
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await dispatch(area);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`no driver after ${attempts} attempts`, { cause: lastError });
}

// Do not change the two functions above: write checks for them below.

/** Named checks, each given the function to test. A check fails by throwing or rejecting. */
export type Checks<F> = Record<string, (fn: F) => void | Promise<void>>;

export const fareChecks: Checks<typeof fare> = {
  "a one-kilometre day ride costs the base fare and one kilometre": (fare) => {
    assert.equal(fare(1, false), 450);
  },
  // YOUR CODE: more checks: started kilometres, night rides and their rounding,
  // a zero distance and a negative one.
};

export const bookingChecks: Checks<typeof bookRide> = {
  "returns the driver from the first answer": async (bookRide) => {
    const dispatch = mock.fn(async (area: string) => `Ada in ${area}`);
    assert.equal(await bookRide(dispatch, "harbour", 3), "Ada in harbour");
  },
  // YOUR CODE: more checks: the area passed and the number of calls, a retry after a
  // rejection, giving up with the message and the last cause, and attempts below 1.
};

// TODO 3: this check treats any as equal to every type and ignores readonly.
// Replace it with the Equal from the lesson.
export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

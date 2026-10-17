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

/** Named checks, each given the function to test. A check fails by throwing or rejecting. */
export type Checks<F> = Record<string, (fn: F) => void | Promise<void>>;

export const fareChecks: Checks<typeof fare> = {
  "a one-kilometre day ride costs the base fare and one kilometre": (fare) => {
    assert.equal(fare(1, false), 450);
  },
  "a ride of no distance costs the base fare": (fare) => {
    assert.equal(fare(0, false), 300);
  },
  "a started kilometre is charged in full": (fare) => {
    assert.equal(fare(2.2, false), 750);
    assert.equal(fare(0.1, false), 450);
  },
  "a night ride costs 25% more, rounded up": (fare) => {
    assert.equal(fare(1, true), 563);
    assert.equal(fare(0, true), 375);
    assert.equal(fare(2.2, true), 938);
  },
  "a negative distance is refused": (fare) => {
    assert.throws(() => fare(-1, false), RangeError);
  },
};

export const bookingChecks: Checks<typeof bookRide> = {
  "returns the driver from the first answer": async (bookRide) => {
    const dispatch = mock.fn(async (area: string) => `Ada in ${area}`);
    assert.equal(await bookRide(dispatch, "harbour", 3), "Ada in harbour");
  },
  "asks once, for the area it was given": async (bookRide) => {
    const dispatch = mock.fn(async (_area: string) => "Grace");
    await bookRide(dispatch, "old town", 3);
    assert.equal(dispatch.mock.callCount(), 1);
    assert.deepEqual(dispatch.mock.calls[0].arguments, ["old town"]);
  },
  "asks again after a rejection": async (bookRide) => {
    const dispatch = mock.fn(async (_area: string) => "Linus");
    dispatch.mock.mockImplementationOnce(async () => {
      throw new Error("all drivers busy");
    });
    assert.equal(await bookRide(dispatch, "station", 3), "Linus");
    assert.equal(dispatch.mock.callCount(), 2);
  },
  "gives up after the last attempt, keeping the last failure as the cause": async (bookRide) => {
    const failures = [new Error("busy 1"), new Error("busy 2"), new Error("busy 3")];
    let call = 0;
    const dispatch = mock.fn(async (_area: string): Promise<string> => {
      throw failures[call++];
    });
    await assert.rejects(bookRide(dispatch, "airport", 3), (error: Error) => {
      assert.equal(error.message, "no driver after 3 attempts");
      assert.equal(error.cause, failures[2]);
      return true;
    });
    assert.equal(dispatch.mock.callCount(), 3);
  },
  "refuses fewer than one attempt without asking": async (bookRide) => {
    const dispatch = mock.fn(async (_area: string) => "Ada");
    await assert.rejects(bookRide(dispatch, "harbour", 0), RangeError);
    assert.equal(dispatch.mock.callCount(), 0);
  },
};

/** True only when A and B are the same type. */
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

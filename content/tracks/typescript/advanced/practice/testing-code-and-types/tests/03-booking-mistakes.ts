// bookingChecks must pass on a correct bookRide written differently and fail on each broken one.
import { bookingChecks, type Checks } from "./solution.js";

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

type Dispatch = (area: string) => Promise<string>;
type BookRide = (dispatch: Dispatch, area: string, attempts: number) => Promise<string>;

const writtenDifferently: BookRide = async (dispatch, area, attempts) => {
  if (attempts < 1 || attempts % 1 !== 0) return Promise.reject(new RangeError("Need at least one attempt."));
  const failures: unknown[] = [];
  while (failures.length < attempts) {
    try {
      const driver = await dispatch(area);
      return driver;
    } catch (failure) {
      failures.push(failure);
    }
  }
  throw new Error(`no driver after ${attempts} attempts`, { cause: failures.at(-1) });
};
check.equal(await failing(bookingChecks, writtenDifferently), [], "every booking check passes on a correct bookRide written differently");

/** A bookRide with one rule bent by the options. */
function variant(options: {
  extraCall?: boolean;
  firstCause?: boolean;
  fixedArea?: boolean;
  keepsAsking?: boolean;
  noCheck?: boolean;
  message?: string;
}): BookRide {
  return async (dispatch, area, attempts) => {
    if (!options.noCheck && (!Number.isInteger(attempts) || attempts < 1)) throw new RangeError("attempts");
    const failures: unknown[] = [];
    let driver: string | undefined;
    const calls = options.extraCall ? attempts + 1 : attempts;
    for (let call = 0; call < calls; call++) {
      try {
        const answer = await dispatch(options.fixedArea ? "city centre" : area);
        driver ??= answer;
        if (!options.keepsAsking) break;
      } catch (failure) {
        failures.push(failure);
      }
    }
    if (driver !== undefined) return driver;
    const message = options.message ?? `no driver after ${attempts} attempts`;
    throw new Error(message, { cause: options.firstCause ? failures[0] : failures.at(-1) });
  };
}

const mistakes: [string, BookRide][] = [
  ["calls dispatch one time more than attempts allows", variant({ extraCall: true })],
  ["keeps the first failure as the cause instead of the last", variant({ firstCause: true })],
  ["always asks for the city centre, whatever area it was given", variant({ fixedArea: true })],
  ["keeps calling dispatch after a driver was found", variant({ keepsAsking: true })],
  ["accepts fewer than one attempt instead of a RangeError", variant({ noCheck: true })],
  ["gives up with a different message", variant({ message: "no taxi available" })],
];
for (const [mistake, broken] of mistakes) {
  check.true((await failing(bookingChecks, broken)).length > 0, `bookingChecks should fail on a bookRide that ${mistake}, but all of them passed`);
}

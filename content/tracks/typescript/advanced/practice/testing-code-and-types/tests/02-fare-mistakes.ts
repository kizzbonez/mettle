// fareChecks must pass on a correct fare written differently and fail on each broken one.
import { fareChecks, type Checks } from "./solution.js";

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

function writtenDifferently(km: number, night: boolean): number {
  if (km < 0 || Number.isNaN(km) || km === Infinity) throw new RangeError("Bad distance.");
  let cents = 300;
  for (let started = 0; started < km; started++) cents += 150;
  if (night) cents = Math.ceil((cents * 5) / 4);
  return cents;
}
check.equal(await failing(fareChecks, writtenDifferently), [], "every fare check passes on a correct fare written differently");

type Fare = (km: number, night: boolean) => number;
const night = (day: number, isNight: boolean): number => (isNight ? Math.ceil(day * 1.25) : day);
const mistakes: [string, Fare][] = [
  [
    "charges only whole kilometres, dropping a started one",
    (km, isNight) => {
      if (km < 0) throw new RangeError("negative");
      return night(300 + 150 * Math.floor(km), isNight);
    },
  ],
  [
    "rounds the distance to the nearest kilometre",
    (km, isNight) => {
      if (km < 0) throw new RangeError("negative");
      return night(300 + 150 * Math.round(km), isNight);
    },
  ],
  [
    "rounds the night price down",
    (km, isNight) => {
      if (km < 0) throw new RangeError("negative");
      const day = 300 + 150 * Math.ceil(km);
      return isNight ? Math.floor(day * 1.25) : day;
    },
  ],
  ["accepts a negative distance", (km, isNight) => night(300 + 150 * Math.ceil(km), isNight)],
  [
    "refuses a ride of no distance",
    (km, isNight) => {
      if (km <= 0) throw new RangeError("no distance");
      return night(300 + 150 * Math.ceil(km), isNight);
    },
  ],
];
for (const [mistake, broken] of mistakes) {
  check.true((await failing(fareChecks, broken)).length > 0, `fareChecks should fail on a fare that ${mistake}, but all of them passed`);
}

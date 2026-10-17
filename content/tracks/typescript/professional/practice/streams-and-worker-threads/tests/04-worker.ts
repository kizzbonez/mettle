import { threadId } from "node:worker_threads";
import { climbInWorker, totalClimb } from "./solution.js";

check.equal(threadId, 0, "the test itself runs on the main thread");

// A long route: 200,000 elevation samples.
const route: number[] = [];
for (let i = 0; i < 200_000; i++) route.push(300 + ((i * 37) % 101) - ((i * 11) % 53));
const expected = totalClimb(route);

const result = await climbInWorker(route);
check.equal(result.climb, expected, "the climb of a long route, computed in the worker");
check.true(Number.isInteger(result.threadId) && result.threadId > 0, "the result names the worker's thread, not the main thread");

// Two routes at once: two workers, two threads.
const [up, down] = await Promise.all([climbInWorker([0, 100, 250, 400]), climbInWorker([400, 250, 100, 0])]);
check.equal([up.climb, down.climb], [400, 0], "two climbs computed at the same time");
check.true(up.threadId > 0 && down.threadId > 0 && up.threadId !== down.threadId, "each call starts its own worker");

check.equal((await climbInWorker([])).climb, 0, "an empty route climbs nothing");

// A failure inside the worker becomes a rejected promise.
await check.rejects(() => climbInWorker([100, Number.NaN, 120]), "a bad elevation makes the worker fail and the promise reject");

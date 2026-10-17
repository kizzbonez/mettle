// washAll: a worker pool that limits how many washes run, keeps the order, and checks its input.
import { washAll } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const started: string[] = [];
const gates = new Map<string, PromiseWithResolvers<number>>();
let running = 0;
let peak = 0;
function wash(load: string): Promise<number> {
  started.push(load);
  running++;
  peak = Math.max(peak, running);
  const gate = Promise.withResolvers<number>();
  gates.set(load, gate);
  return gate.promise.finally(() => {
    running--;
  });
}
function finish(load: string, kilos: number): void {
  const gate = gates.get(load);
  if (gate === undefined) fail(`the test wanted to finish "${load}", but washAll never started it`);
  gate.resolve(kilos);
}

const job = washAll(["towels", "jeans", "sheets", "shirts", "socks"], 2, wash);
await turn();
check.equal(started, ["towels", "jeans"], "only two loads start on two machines");
finish("jeans", 3);
await turn();
check.equal(started, ["towels", "jeans", "sheets"], "the next load starts as soon as a machine is free");
finish("towels", 5);
await turn();
check.equal(started, ["towels", "jeans", "sheets", "shirts"], "loads start in their list order");
finish("shirts", 2);
finish("sheets", 4);
await turn();
check.equal(started.length, 5, "every load is washed in the end");
finish("socks", 1);
check.equal(await job, [5, 3, 4, 2, 1], "results follow the order of the loads, not the order washes finished");
check.equal(peak, 2, "never more than two washes ran at once");

const typed = washAll(["duvet"], 1, async (load) => load.length);
export type Cases = [Expect<Equal<typeof typed, Promise<number[]>>>];
check.equal(await typed, [5], "a single load on one machine is washed");

let calls = 0;
const many = await washAll([1, 2, 3], 10, async (kilos) => {
  calls++;
  return kilos * 2;
});
check.equal(many, [2, 4, 6], "more machines than loads is fine");
check.equal(calls, 3, "each load is washed exactly once");
check.equal(await washAll([], 2, wash), [], "an empty list resolves with an empty list");

for (const machines of [0, -1, 1.5, Number.NaN]) {
  const before = started.length;
  await check.rejects(() => washAll(["rug"], machines, wash), `${machines} machines is refused with a RangeError`, RangeError);
  check.equal(started.length, before, `nothing is washed with ${machines} machines`);
}

const stuck = new Error("drum stuck");
const failed = await check.rejects(
  () =>
    washAll(["coat", "hat"], 1, async (load) => {
      if (load === "coat") throw stuck;
      return 1;
    }),
  "washAll rejects when a wash fails",
);
check.true(failed === stuck, "washAll rejects with the error the wash threw");

export function misuse(): void {
  // @ts-expect-error the loads are strings, so wash must take a string
  washAll(["towels"], 1, async (load: number) => load);
}

// washAll with an AbortSignal: no wash starts once it is aborted, and the reason is the rejection.
import { washAll } from "./solution.js";

const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const closed = new AbortController();
const closing = new Error("closed for the night");
closed.abort(closing);
let washedWhileClosed = 0;
const refused = await check.rejects(
  () =>
    washAll(["towels"], 1, async () => {
      washedWhileClosed++;
      return 1;
    }, closed.signal),
  "washAll rejects when its signal is already aborted",
);
check.true(refused === closing, "the rejection is the signal's reason");
check.equal(washedWhileClosed, 0, "no wash starts with an already aborted signal");
await check.rejects(() => washAll([], 1, async () => 1, closed.signal), "an empty list with an aborted signal is refused too");

const started: string[] = [];
const gates = new Map<string, PromiseWithResolvers<string>>();
function wash(load: string): Promise<string> {
  started.push(load);
  const gate = Promise.withResolvers<string>();
  gates.set(load, gate);
  return gate.promise;
}

const shift = new AbortController();
const job = washAll(["sheets", "jeans", "towels", "socks"], 2, wash, shift.signal);
const outcome = job.then(
  () => "resolved",
  (error: unknown) => error,
);
await turn();
check.equal(started, ["sheets", "jeans"], "two loads start before the abort");
const stop = new Error("night shift pressed stop");
shift.abort(stop);
gates.get("sheets")?.resolve("sheets done");
gates.get("jeans")?.resolve("jeans done");
await turn();
await turn();
check.equal(started, ["sheets", "jeans"], "no new load starts after the signal is aborted");
check.true((await outcome) === stop, "washAll rejects with the reason given to abort");

const late = new AbortController();
const finished = await washAll(["cap"], 1, async (load) => `${load} done`, late.signal);
late.abort(new Error("too late"));
check.equal(finished, ["cap done"], "a run that finished before the abort keeps its results");
const plain = await washAll(["scarf"], 1, async (load) => load.toUpperCase());
check.equal(plain, ["SCARF"], "the signal is optional");

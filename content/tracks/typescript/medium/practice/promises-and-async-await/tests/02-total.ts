// totalCopies asks every branch before any answers, waits for all of them, and rejects with the
// error of a branch that fails. The test releases each answer itself.
import { totalCopies, type Branch } from "./solution.js";

interface FakeBranch {
  branch: Branch;
  asked: string[];
  answer: (copies: number) => void;
  fail: (reason: Error) => void;
}

function fakeBranch(name: string): FakeBranch {
  const asked: string[] = [];
  const pending: PromiseWithResolvers<number>[] = [];
  return {
    branch: {
      name,
      copiesOf(title: string): Promise<number> {
        asked.push(title);
        const answer = Promise.withResolvers<number>();
        pending.push(answer);
        return answer.promise;
      },
    },
    asked,
    answer: (copies) => pending[pending.length - 1].resolve(copies),
    fail: (reason) => pending[pending.length - 1].reject(reason),
  };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const [central, harbour, hillside] = ["Central", "Harbour", "Hillside"].map(fakeBranch);
let settled = false;
const total = totalCopies([central.branch, harbour.branch, hillside.branch], "Dune");
total.then(
  () => (settled = true),
  () => (settled = true),
);
check.equal(
  [central.asked, harbour.asked, hillside.asked],
  [["Dune"], ["Dune"], ["Dune"]],
  "totalCopies asks every branch once before any of them answers",
);
hillside.answer(2);
central.answer(4);
await flush();
check.true(!settled, "totalCopies waits for the last branch to answer");
harbour.answer(0);
check.equal(await total, 6, "the copies at the three branches are added up");

const [east, west] = ["East", "West"].map(fakeBranch);
const failing = check.rejects(() => totalCopies([east.branch, west.branch], "Emma"), "totalCopies rejects when a branch is offline");
east.answer(3);
west.fail(new Error("West catalogue offline"));
const error = await failing;
check.equal(error.message, "West catalogue offline", "the rejection carries the offline branch's own error");

check.equal(await totalCopies([], "Dune"), 0, "no branches hold no copies");

function typeChecksOnly(): void {
  // @ts-expect-error totalCopies returns a promise, so its number must be awaited
  const copies: number = totalCopies([], "Dune");
}
check.true(typeof typeChecksOnly === "function", "totalCopies returns a Promise<number>");

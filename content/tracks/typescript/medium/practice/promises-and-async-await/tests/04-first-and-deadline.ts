// firstWithCopy resolves with the first branch to answer with a copy, or rejects with an
// AggregateError; withDeadline settles like whichever of the work and the deadline comes first.
import { firstWithCopy, withDeadline, type Branch } from "./solution.js";

interface FakeBranch {
  branch: Branch;
  answer: (copies: number) => void;
  fail: (reason: Error) => void;
}

function fakeBranch(name: string): FakeBranch {
  const pending: PromiseWithResolvers<number>[] = [];
  return {
    branch: {
      name,
      copiesOf(): Promise<number> {
        const answer = Promise.withResolvers<number>();
        pending.push(answer);
        return answer.promise;
      },
    },
    answer: (copies) => pending[pending.length - 1].resolve(copies),
    fail: (reason) => pending[pending.length - 1].reject(reason),
  };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const [central, harbour, hillside] = ["Central", "Harbour", "Hillside"].map(fakeBranch);
let found: string | undefined;
const first = firstWithCopy([central.branch, harbour.branch, hillside.branch], "Dune");
first.then((name) => (found = name), () => undefined);
central.answer(0);
harbour.fail(new Error("offline"));
await flush();
check.equal(found, undefined, "a branch with no copy and an offline branch do not count");
hillside.answer(2);
check.equal(await first, "Hillside", "the first branch to answer with a copy wins");

const [east, west] = ["East", "West"].map(fakeBranch);
const race = firstWithCopy([east.branch, west.branch], "Emma");
west.answer(3);
await flush();
east.answer(5);
check.equal(await race, "West", "the first to answer wins, not the first in the list");

const [north, south, quay] = ["North", "South", "Quay"].map(fakeBranch);
const none = check.rejects(() => firstWithCopy([north.branch, south.branch, quay.branch], "Ulysses"),
  "firstWithCopy rejects with an AggregateError when no branch has a copy", AggregateError);
north.answer(0);
south.fail(new Error("offline"));
quay.answer(0);
const aggregate = await none;
check.equal((aggregate as AggregateError).errors.length, 3, "the AggregateError holds one reason per branch");

const late = Promise.withResolvers<number>();
const deadline = Promise.withResolvers<void>();
const expired = check.rejects(() => withDeadline(late.promise, deadline.promise), "withDeadline rejects when the deadline comes first");
deadline.resolve();
const timeout = await expired;
check.equal(timeout.message, "deadline passed", "the deadline's error message");
late.resolve(9);

const quick = Promise.withResolvers<string>();
const later = Promise.withResolvers<void>();
const result = withDeadline(quick.promise, later.promise);
quick.resolve("on the shelf");
await flush();
later.resolve();
check.equal(await result, "on the shelf", "withDeadline gives the work's value when the work comes first");

const broken = Promise.withResolvers<number>();
const failed = check.rejects(() => withDeadline(broken.promise, new Promise<void>(() => {})), "withDeadline rejects when the work rejects");
broken.reject(new Error("lost in transit"));
check.equal((await failed).message, "lost in transit", "the work's own error is passed on");

async function typeChecksOnly(): Promise<void> {
  const title: string = await withDeadline(Promise.resolve("Dune"), new Promise<void>(() => {}));
  // @ts-expect-error withDeadline resolves with the type of its work
  const wrong: number = await withDeadline(Promise.resolve("Dune"), new Promise<void>(() => {}));
}
check.true(typeof typeChecksOnly === "function", "withDeadline is generic in the type of its work");
